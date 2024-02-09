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

  public addSpan(selection?: TextSelection) {
    if (!selection) return;

    if (!this.config.allowCharacter) {
      if (this.isEmpty(selection.text)) return;

      this.completeLeftSide(selection);

      this.completeRightSide(selection);
    }

    if (!this.config.allowOverlap) {
      const overlaps = this.selections.filter((s) => {
        return (
          (selection.from <= s.from && selection.to >= s.to) ||
          (selection.from >= s.from && selection.to <= s.to) ||
          (selection.from < s.from && selection.to > s.from) ||
          (selection.from < s.to && selection.to > s.to)
        );
      });

      this.selections = this.selections.filter((s) => !overlaps.includes(s));
    }

    if (this.exists(selection)) return;

    const { from, to, entity, text } = selection;

    this.select({
      from,
      to,
      entity,
      text,
    });
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

  private exists(selection: TextSelection) {
    return this.selections.some(
      (s) => this.createId(s) === this.createId(selection)
    );
  }

  private select(selected: Span) {
    this.selections.push(selected);
  }

  private completeLeftSide(selection: TextSelection) {
    while (true) {
      const prevChar = selection.nodeText.charAt(selection.from - 1);

      if (
        this.isEmpty(prevChar) ||
        this.isSymbol(prevChar) ||
        selection.to === 0
      ) {
        break;
      }

      const firstCharacter = selection.text.charAt(0);

      if (this.isEmpty(firstCharacter)) {
        selection.from++;
        selection.text = selection.text.slice(1);
        break;
      }

      selection.from--;
      selection.text = `${prevChar}${selection.text}`;
    }
  }

  private completeRightSide(selection: TextSelection) {
    while (true) {
      const nextCharacter = selection.nodeText.charAt(selection.to);

      if (
        this.isEmpty(nextCharacter) ||
        this.isSymbol(nextCharacter) ||
        selection.to === selection.nodeText.length - 1
      ) {
        break;
      }

      const lastCharacter = selection.text.charAt(selection.text.length - 1);

      if (this.isEmpty(lastCharacter)) {
        selection.to--;
        selection.text = selection.text.slice(0, -1);
        break;
      }

      selection.to++;
      selection.text = `${selection.text}${nextCharacter}`;
    }
  }

  private isEmpty(character: string) {
    return character === " " || character === "\n";
  }

  private isSymbol(character: string) {
    const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

    return (
      !numbers.includes(character) &&
      character.toLowerCase() === character.toUpperCase()
    );
  }

  private createId(span: Span | TextSelection) {
    return `${span.from}-${span.to}-${span.entity}`;
  }
}
