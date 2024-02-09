import { id } from "./jest.config";

export type TextSelection = {
  from: number;
  to: number;
  entity: string;
  text: string;
  nodeText: string;
};

export type Span = {
  from: number;
  to: number;
  entity: string;
  text: string;
};

type Configuration = {
  allowOverlap: boolean;
  allowCharacter: boolean;
};

export class SpanSelection {
  private selections: Span[] = [];

  get spans() {
    return [...this.selections];
  }

  config: Configuration = {
    allowOverlap: false,
    allowCharacter: false,
  };

  public addSpan(textSelection?: TextSelection) {
    if (!textSelection) return;

    const { nodeText, ...rest } = textSelection;

    const selected = {
      ...rest,
    };

    if (!this.config.allowCharacter) {
      if (!this.isValidSelection(textSelection)) return;

      this.completeLeftSide(nodeText, selected);

      this.completeRightSide(nodeText, selected);
    }

    if (!this.config.allowOverlap) {
      const overlaps = this.selections.filter((s) => {
        return (
          (selected.from <= s.from && selected.to >= s.to) ||
          (selected.from >= s.from && selected.to <= s.to) ||
          (selected.from < s.from && selected.to > s.from) ||
          (selected.from < s.to && selected.to > s.to)
        );
      });

      this.selections = this.selections.filter((s) => !overlaps.includes(s));
    }

    if (this.exists(selected)) return;

    this.select(selected);
  }

  loadSpans(selections: Span[]) {
    selections.forEach((s) => this.select(s));
  }

  clear() {
    this.selections = [];
  }

  removeSpan(span: Span) {
    this.selections = this.selections.filter(
      (s) => this.createId(s) !== this.createId(span)
    );
  }

  private exists(selected: Span) {
    return this.selections.some(
      (s) => this.createId(s) === this.createId(selected)
    );
  }

  private select(selected: Span) {
    this.selections.push(selected);
  }

  private completeLeftSide(
    nodeText: string,
    selected: { from: number; to: number; entity: string; text: string }
  ) {
    while (true) {
      const previousCharacter = nodeText.charAt(selected.from - 1);

      if (this.isEmpty(previousCharacter) || selected.from === 0) {
        break;
      }
      selected.from--;
      selected.text = `${previousCharacter}${selected.text}`;
    }
  }

  private completeRightSide(
    nodeText: string,
    selected: { from: number; to: number; entity: string; text: string }
  ) {
    let iteration = 0;
    while (true) {
      const nextCharacter = nodeText.charAt(selected.to);

      if (this.isEmpty(nextCharacter) || selected.to === nodeText.length - 1) {
        if (
          this.isSymbol(selected.text[selected.text.length - 1]) &&
          iteration > 0
        ) {
          selected.text = selected.text.substring(0, selected.text.length - 1);
          selected.to--;
        }
        break;
      }

      iteration++;
      selected.to++;
      selected.text = `${selected.text}${nextCharacter}`;
    }
  }

  private isEmpty(character: string) {
    return character === " " || character === "\n";
  }

  private isJustAWord(textSelection: TextSelection) {
    const currentText = textSelection.text;

    const previous = textSelection.nodeText.charAt(textSelection.from - 1);
    const next = textSelection.nodeText.charAt(textSelection.to);

    return (
      currentText.length === 1 &&
      this.isEmpty(previous) &&
      this.isEmpty(next) &&
      !this.isSymbol(currentText)
    );
  }

  private isSymbol(character: string) {
    const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

    return (
      !numbers.includes(character) &&
      character.toLowerCase() === character.toUpperCase()
    );
  }

  private isValidSelection(textSelection: TextSelection) {
    if (this.isEmpty(textSelection.text[0])) return false;
    if (this.isJustAWord(textSelection)) return true;

    return true;
  }

  private createId(span: Span) {
    return `${span.from}-${span.to}-${span.entity}`;
  }
}
