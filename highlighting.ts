type Dictionary<V> = {
  [key: string]: V;
};

export type Selected = {
  from: number;
  to: number;
  entity: string;
  text: string;
};

type Configuration = {
  allowOverlap: boolean;
  allowCharacter: boolean;
};

type Styles = {
  entitiesCSS: Dictionary<string>;
  entitiesGap: number;
  entityClassName: string;
};

type StylesParams = {
  /** Is the Highlight CSS class name for each entity */
  entitiesCSS: Dictionary<string>;

  /** This gap is used to separate spans vertically when allow overlap is true */
  entitiesGap?: number;

  /** This class name is used to style the entity span */
  entityClassName?: string;
};

export class Highlighting {
  private selections: Selected[] = [];
  private node: HTMLElement | undefined;
  private readonly styles: Styles;
  entity: string = "";
  config: Configuration = {
    allowOverlap: false,
    allowCharacter: false,
  };

  constructor(styles: StylesParams) {
    this.styles = {
      entitiesGap: 8,
      entityClassName: "",
      ...styles,
    };
  }

  get highlights() {
    return [...this.selections];
  }

  applyConfig(config: Configuration) {
    this.config = config;
  }

  private get entitySpanContainer() {
    let node = document.getElementById("highlight__entity-container");
    if (!node) {
      node = document.createElement("div");
      node.id = "highlight__entity-container";
    }

    return node;
  }

  attachNode(node: HTMLElement) {
    this.node = node;
    document.body.appendChild(this.entitySpanContainer);

    this.node.addEventListener("mouseup", () => {
      this.highlightUserSelection();

      this.applyStyles();
    });

    window.addEventListener("resize", () => {
      this.applyStyles();
    });
  }

  loadHighlight(selections: Selected[] = []) {
    for (const selected of selections) {
      this.highlight(selected);
    }

    this.applyStyles();
  }

  removeAllHighlights() {
    this.selections = [];
    this.applyStyles();
  }

  private highlightUserSelection() {
    const selection = this.getSelectedText();
    if (selection?.type !== "Range" || !this.entity) return;

    const selected = this.createSelected(selection);

    if (!this.config.allowCharacter) {
      if (selected.text === "") return;

      const nodeText = this.node!.firstChild!.textContent!;

      while (true) {
        const previousCharacter = nodeText
          .charAt(selected.from - 1)
          .replaceAll("\n", " ");

        if (previousCharacter === " " || selected.from === 0) {
          break;
        }
        selected.from--;
        selected.text = `${previousCharacter}${selected.text}`;
      }

      while (true) {
        const nextCharacter = nodeText
          .charAt(selected.to)
          .replaceAll("\n", " ");

        if (nextCharacter === " " || selected.to === nodeText.length - 1) {
          break;
        }
        selected.to++;
        selected.text = `${selected.text}${nextCharacter}`;
      }
    }

    if (!this.config.allowOverlap) {
      const overlapping = this.selections.filter((s) => {
        return (
          (selected.from <= s.from && selected.to >= s.to) ||
          (selected.to <= s.to && selected.to >= s.from) ||
          (selected.from <= s.to && selected.from >= s.from)
        );
      });

      this.selections = this.selections.filter((s) => !overlapping.includes(s));
    }

    this.highlight(selected);

    selection.empty();
  }

  private getSelectedText() {
    if (window.getSelection) {
      return window.getSelection();
    }
  }

  private highlight(selected: Selected) {
    if (!this.node) {
      throw new Error(
        "Node not attached, use `attachNode` method with HTMLElement that contains the text to select"
      );
    }

    if (!CSS.highlights) {
      console.error(
        "The CSS Custom Highlight API is not supported in this browser!"
      );

      return;
    }

    this.selections.push(selected);
  }

  private applyStyles() {
    this.applyHighlightStyle();
    this.applyEntityStyle();
  }

  private applyHighlightStyle() {
    CSS.highlights.clear();
    const highlights: Dictionary<Range[]> = {};

    for (const part of this.selections) {
      if (!highlights[part.entity]) highlights[part.entity] = [];

      const range = this.createRange(part);

      highlights[part.entity].push(range);
    }

    for (const highlight of Object.entries(highlights)) {
      const [entity, selections] = highlight;
      const { entitiesCSS } = this.styles;
      const className = entitiesCSS[entity as keyof typeof entitiesCSS];

      CSS.highlights.set(className, new Highlight(...selections.flat()));
    }
  }

  private applyEntityStyle() {
    const entityPosition: {
      left: number;
      top: number;
      entity: string;
    }[] = [];

    while (this.entitySpanContainer.firstChild) {
      this.entitySpanContainer.removeChild(this.entitySpanContainer.firstChild);
    }

    for (const selection of this.selections) {
      const { entity } = selection;
      const range = this.createRange({ ...selection, to: selection.from + 1 });

      const { left, top } = range.getBoundingClientRect();

      if (entityPosition.some((p) => p.left === left && p.top === top)) {
        entityPosition.push({
          left: left,
          top: top + this.styles.entitiesGap,
          entity,
        });

        continue;
      }

      entityPosition.push({ left, top, entity });
    }

    for (const { left, top, entity } of entityPosition) {
      const span = document.createElement("span");
      span.className = this.styles.entityClassName;

      span.style.left = `${left}px`;
      span.style.top = `${top}px`;

      span.innerText = entity;

      this.entitySpanContainer.appendChild(span);
    }
  }

  private createRange({ from, to }: Selected) {
    const range = new Range();

    range.setStart(this.node!.firstChild!, from);
    range.setEnd(this.node!.firstChild!, to);

    return range;
  }

  private createSelected(selection: Selection) {
    const text = selection.toString();
    const from = selection.anchorOffset;
    const to = selection.focusOffset;

    return {
      from: Math.min(from, to),
      to: Math.max(from, to),
      text,
      entity: this.entity,
    };
  }
}
