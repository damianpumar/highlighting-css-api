type Dictionary<V> = {
  [key: string]: V;
};

export type Selected = {
  from: number;
  to: number;
  entity: string;
  text: string;
};

export class Highlighting {
  private highlights: Dictionary<Range[]> = {};
  private _selections: Selected[] = [];
  private node: HTMLElement | undefined;
  entity: string = "";

  constructor(private readonly cssByGroup: Dictionary<string>) {}

  get selections() {
    return [...this._selections];
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
    this._selections = [];
    this.highlights = {};

    CSS.highlights.clear();
  }

  private highlightUserSelection() {
    const selection = this.getSelectedText();
    if (selection?.type !== "Range" || !this.entity) return;

    const text = selection.toString();
    const from = selection.anchorOffset;
    const to = selection.focusOffset;

    const selected: Selected = {
      from,
      to,
      text,
      entity: this.entity,
    };

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

    const { entity } = selected;

    const selection = this.getSelectedText()!;

    const range = this.createRange(selected);

    if (!this.highlights[entity]) this.highlights[entity] = [];
    this.highlights[entity].push(range);

    this.applyHighlightStyle();

    this._selections.push(selected);
    selection.empty();
  }

  private applyHighlightStyle() {
    for (const highlight of Object.entries(this.highlights)) {
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
}
