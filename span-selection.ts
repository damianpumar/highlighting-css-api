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
      if (this.isEmpty(selected.text)) return;
      if (this.isASymbol(selected.text)) return;
      if (this.hasSelectedACharacter(textSelection)) return;

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

    this.select(selected);
  }

  loadSpans(selections: Span[]) {
    selections.forEach((s) => this.select(s));
  }

  clear() {
    this.selections = [];
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

      if (this.isALimit(previousCharacter) || selected.from === 0) {
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
    while (true) {
      const nextCharacter = nodeText.charAt(selected.to);

      if (this.isALimit(nextCharacter) || selected.to === nodeText.length - 1) {
        break;
      }
      selected.to++;
      selected.text = `${selected.text}${nextCharacter}`;
    }
  }

  private hasSelectedACharacter(textSelection: TextSelection) {
    return (
      textSelection.text.length === 1 &&
      !this.isEmpty(textSelection.nodeText.charAt(textSelection.from - 1)) &&
      !this.isEmpty(textSelection.nodeText.charAt(textSelection.to))
    );
  }

  private isEmpty(character: string) {
    return character === " " || character === "\n";
  }

  private isALimit(character: string) {
    return this.isEmpty(character) || this.isASymbol(character);
  }

  private isASymbol(character: string) {
    return character.toLowerCase() === character.toUpperCase();
  }
}
