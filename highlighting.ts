import { SpanSelection, type Span, type TextSelection } from "./span-selection";

type Dictionary<V> = {
  [key: string]: V;
};

type Styles = {
  /** Is the Highlight CSS class name for each entity */
  entitiesCSS: Dictionary<string>;

  /** This gap is used to separate spans vertically when allow overlap is true */
  entitiesGap?: number;

  /** This class name is used to style the entity span */
  entityClassName?: string;

  /** Span container ID */
  spanContainerId?: string;
};

export class Highlighting {
  private readonly spanSelection = new SpanSelection();
  private node: HTMLElement | undefined;
  private readonly styles: Required<Styles>;
  entity: string = "";

  constructor(styles: Styles) {
    this.styles = {
      entitiesGap: 8,
      entityClassName: "",
      spanContainerId: "entity-span-container",
      ...styles,
    };
  }

  get spans() {
    return [...this.spanSelection.spans];
  }

  get config() {
    return this.spanSelection.config;
  }

  private get entitySpanContainer() {
    const { spanContainerId } = this.styles;

    let node = document.getElementById(spanContainerId);
    if (!node) {
      node = document.createElement("div");
      node.id = spanContainerId;
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
      this.applyEntityStyle();
    });
  }

  loadHighlights(selections: Span[] = []) {
    if (!CSS.highlights) {
      console.error(
        "The CSS Custom Highlight API is not supported in this browser!"
      );
    }

    if (!this.node) {
      throw new Error(
        "Node not attached, use `attachNode` method with HTMLElement that contains the text to select"
      );
    }

    this.spanSelection.loadSpans(selections);

    this.applyStyles();
  }

  removeAllHighlights() {
    this.spanSelection.clear();
    this.applyStyles();
  }

  private highlightUserSelection() {
    const textSelection = this.createTextSelection();

    this.spanSelection.addSpan(textSelection);
  }

  private getSelectedText() {
    if (window.getSelection) {
      return window.getSelection();
    }
  }

  private applyStyles() {
    this.applyHighlightStyle();
    this.applyEntityStyle();
  }

  private applyHighlightStyle() {
    CSS.highlights.clear();
    const highlights: Dictionary<Range[]> = {};

    for (const span of this.spans) {
      if (!highlights[span.entity]) highlights[span.entity] = [];

      const range = this.createRange(span);

      highlights[span.entity].push(range);
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
      id: string;
      left: number;
      top: number;
      entity: string;
    }[] = [];

    while (this.entitySpanContainer.firstChild) {
      this.entitySpanContainer.removeChild(this.entitySpanContainer.firstChild);
    }

    for (const span of this.spans) {
      const { entity } = span;
      const range = this.createRange({ ...span, to: span.from + 1 });

      const { left, top } = range.getBoundingClientRect();
      const spanTop = top + window.scrollY;
      const id = `${span.from}-${span.to}-${entity}`;

      const position = { id, left, top: spanTop, entity };

      if (entityPosition.some((p) => p.left === left && p.top === top)) {
        position.top = spanTop + this.styles.entitiesGap;
      }

      entityPosition.push(position);
    }

    for (const { id, left, top, entity } of entityPosition) {
      const span = document.createElement("span");
      span.className = this.styles.entityClassName;

      span.style.left = `${left}px`;
      span.style.top = `${top}px`;

      span.innerText = entity;

      const button = document.createElement("span");
      button.innerText = " - X ";
      button.style.cursor = "pointer";
      button.onclick = () => {
        this.removeSpan(id);
      };
      span.appendChild(button);

      this.entitySpanContainer.appendChild(span);
    }
  }
  private removeSpan(id: string) {
    this.spanSelection.removeSpan(id);
    this.applyStyles();
  }

  private createRange({ from, to }: Span) {
    const range = new Range();

    range.setStart(this.node!.firstChild!, from);
    range.setEnd(this.node!.firstChild!, to);

    return range;
  }

  private createTextSelection(): TextSelection | undefined {
    const selection = this.getSelectedText();
    if (selection?.type !== "Range" || !this.entity) return;

    const text = selection.toString();
    const from = selection.anchorOffset;
    const to = selection.focusOffset;
    const nodeText = selection.focusNode?.textContent!;

    selection.empty();

    return {
      from: Math.min(from, to),
      to: Math.max(from, to),
      text,
      entity: this.entity,
      nodeText,
    };
  }
}
