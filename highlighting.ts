type Dictionary<V> = {
  [key: string]: V;
};

export type Selected = {
  from: number;
  to: number;
  group: string;
  text: string;
};

export class Highlighting {
  private highlights: Dictionary<Range[]> = {};
  private _selections: Selected[] = [];
  private node: HTMLElement | undefined;
  group: string = "";

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

  private highlightUserSelection() {
    const selection = this.getSelectedText();
    if (selection?.type !== "Range" || !this.group) return;

    const text = selection.toString();
    const from = selection.anchorOffset;
    const to = selection.focusOffset;

    const selected: Selected = {
      from,
      to,
      text,
      group: this.group,
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

    const selection = this.getSelectedText()!;

    const { from, to, group } = selected;

    const range = document.createRange();
    range.setStart(this.node.firstChild!, from);
    range.setEnd(this.node.firstChild!, to);

    if (!this.highlights[group]) this.highlights[group] = [];
    this.highlights[group].push(range);

    selection.addRange(range);
    selection.empty();

    this._selections.push(selected);

    this.applyHighlightStyle();
  }

  private applyHighlightStyle() {
    for (const highlight of Object.entries(this.highlights)) {
      const [key, value] = highlight;
      const className = this.cssByGroup[key as keyof typeof this.cssByGroup];

      CSS.highlights.set(className, new Highlight(...value.flat()));
    }
  }
}
