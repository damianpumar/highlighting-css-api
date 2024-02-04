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
  hl: Dictionary<Range[]> = {};
  selections: Selected[] = [];
  group: string;
  node: HTMLElement;

  constructor(private readonly cssByGroup: Dictionary<string>) {}

  attachNode(node: HTMLElement) {
    this.node = node;

    this.node.addEventListener("mouseup", () => {
      this.highlightUserSelection();
    });

    this.loadHighlight();
  }

  getSelectedText() {
    if (window.getSelection) {
      return window.getSelection();
    }
  }

  highlight(selected: Selected) {
    if (!CSS.highlights) {
      alert("The CSS Custom Highlight API is not supported in this browser!");
    }

    const { from, to, group } = selected;
    const selection = this.getSelectedText()!;

    const range = document.createRange();
    range.setStart(this.node.firstChild!, from);
    range.setEnd(this.node.firstChild!, to);

    selection.addRange(range);

    if (!this.hl[group]) this.hl[group] = [];
    this.hl[group].push(range);

    selection.empty();

    this.applyHighlightSelection();
  }

  highlightUserSelection() {
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
    this.selections.push(selected);
    localStorage.setItem("selection", JSON.stringify(this.selections));
  }

  applyHighlightSelection() {
    for (const iterator of Object.entries(this.hl)) {
      const [key, value] = iterator;
      const cl = this.cssByGroup[key as keyof typeof this.cssByGroup];

      CSS.highlights.set(cl, new Highlight(...value.flat()));
    }

    if (Object.keys(this.hl).length > 1) {
      this.node.style.lineHeight = "1.2";
    }
    if (Object.keys(this.hl).length > 2) {
      this.node.style.lineHeight = "1.8";
    }
  }

  clearSelection() {
    localStorage.removeItem("selection");
    window.location.reload();
  }

  loadHighlight() {
    const savedSelections = localStorage.getItem("selection") ?? "[]";

    const parsedSavedSelections = JSON.parse(savedSelections);

    for (const selected of parsedSavedSelections) {
      this.highlight(selected);
      this.selections.push(selected);
    }
  }
}
