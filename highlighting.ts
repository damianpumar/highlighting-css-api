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
  private _selections: Dictionary<Selected[]> = {};
  private node: HTMLElement | undefined;
  entity: string = "";

  constructor(private readonly cssByGroup: Dictionary<string>) {}

  get selections() {
    return Object.entries(this._selections).flatMap(([_, value]) => value);
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

  deleteAllHighlights() {
    this._selections = {};

    this.applyHighlightStyle(this.node!);
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

    if (!this._selections[this.entity]) this._selections[this.entity] = [];
    this._selections[this.entity].push(selected);

    this.applyHighlightStyle(this.node);
  }

  private applyHighlightStyle(node: HTMLElement) {
    const selection = this.getSelectedText()!;

    for (const [entity, selectees] of Object.entries(this._selections)) {
      const className = this.cssByGroup[entity as keyof typeof this.cssByGroup];
      const ranges = [];

      for (const selected of selectees) {
        const range = this.createRange(node, selected);
        selection.addRange(range);
        ranges.push(range);
      }

      CSS.highlights.set(className, new Highlight(...ranges.flat()));
    }

    selection.empty();
  }

  private createRange(node: HTMLElement, selected: Selected) {
    const range = document.createRange();
    const { from, to } = selected;

    range.setStart(node.firstChild!, from);
    range.setEnd(node.firstChild!, to);

    return range;
  }
}
