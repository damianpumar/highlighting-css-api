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

export class Highlighting {
  private selections: Selected[] = [];
  private node: HTMLElement | undefined;
  entity: string = "";
  config: Configuration = {
    allowOverlap: false,
    allowCharacter: false,
  };

  constructor(private readonly cssByGroup: Dictionary<string>) {}

  get highlights() {
    return [...this.selections];
  }

  applyConfig(config: Configuration) {
    this.config = config;
  }

  attachNode(node: HTMLElement) {
    this.node = node;

    this.node.addEventListener("mouseup", () => {
      this.highlightUserSelection();
    });
  }

  loadHighlight(selections: Selected[] = []) {
    for (const selected of selections) {
      this.highlight(selected);
    }
  }

  removeAllHighlights() {
    this.selections = [];

    CSS.highlights.clear();
  }

  private highlightUserSelection() {
    const selection = this.getSelectedText();
    if (selection?.type !== "Range" || !this.entity) return;

    const selected = this.createSelected(selection);

    if (!this.config.allowCharacter && selected.text.length === 1) return;

    if (!this.config.allowOverlap) {
      const overlapping = this.selections.filter((s) => {
        return (
          (selected.from <= s.from && selected.to >= s.to) ||
          (selected.from <= s.from && selected.to >= s.to) ||
          (selected.to <= s.to && selected.to >= s.from) ||
          (selected.from <= s.to && selected.from >= s.from)
        );
      });

      this.selections = this.selections.filter((s) => !overlapping.includes(s));
    }

    this.highlight(selected);
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

    this.applyHighlightStyle();
  }

  private applyHighlightStyle() {
    const highlights: Dictionary<Range[]> = {};

    for (const part of this.selections) {
      if (!highlights[part.entity]) highlights[part.entity] = [];

      const range = this.createRange(part);

      highlights[part.entity].push(range);
    }

    for (const highlight of Object.entries(highlights)) {
      const [entity, selections] = highlight;
      const className = this.cssByGroup[entity as keyof typeof this.cssByGroup];

      CSS.highlights.set(className, new Highlight(...selections.flat()));
    }
  }

  private createRange({ from, to }: Selected) {
    const range = document.createRange();

    range.setStart(this.node!.firstChild!, from);
    range.setEnd(this.node!.firstChild!, to);

    return range;
  }

  private createSelected(selection: Selection) {
    const text = selection.toString();
    const from = selection.anchorOffset;
    const to = selection.focusOffset;

    return {
      from,
      to,
      text,
      entity: this.entity,
    };
  }
}
