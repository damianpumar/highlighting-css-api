<template>
  <div class="container">
    <div class="left">
      <h2>Text</h2>

      <button @click="onClear">Clear</button>

      <div v-for="token in tokens">
        <p @click="selectToken(token)">
          {{ token }}
        </p>
      </div>
      <p>Selected: {{ selectedToken }}</p>
      <span id="lorem" v-html="field"></span>
    </div>

    <div class="right">
      <h2>Json (Highlight object)</h2>
      <span v-text="JSON.stringify(selections)" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Selected } from "./Selected";

const field = `What is Lorem Ipsum? Lorem Ipsum is simply dummy text of the printing and
      typesetting industry. Lorem Ipsum has been the industry's standard dummy
      text ever since the 1500s, when an unknown printer took a galley of type
      and scrambled it to make a type specimen book. It has survived not only
      five centuries, but also the leap into electronic typesetting, remaining
      essentially unchanged. It was popularised in the 1960s with the release of
      Letraset sheets containing Lorem Ipsum passages, and more recently with
      desktop publishing software like Aldus PageMaker including versions of
      Lorem Ipsum. Why do we use it? It is a long established fact that a reader
      will be distracted by the readable content of a page when looking at its
      layout. The point of using Lorem Ipsum is that it has a more-or-less
      normal distribution of letters, as opposed to using 'Content here, content
      here', making it look like readable English. Many desktop publishing
      packages and web page editors now use Lorem Ipsum as their default model
      text, and a search for 'lorem ipsum' will uncover many web sites still in
      their infancy. Various versions have evolved over the years, sometimes by
      accident, sometimes on purpose (injected humour and the like). Where does
      it come from? Contrary to popular belief, Lorem Ipsum is not simply random
      text. It has roots in a piece of classical Latin literature from 45 BC,
      making it over 2000 years old. Richard McClintock, a Latin professor at
      Hampden-Sydney College in Virginia, looked up one of the more obscure
      Latin words, consectetur, from a Lorem Ipsum passage, and going through
      the cites of the word in classical literature, discovered the undoubtable
      source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus
      Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in
      45 BC. This book is a treatise on the theory of ethics, very popular
      during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor
      sit amet..", comes from a line in section 1.10.32. The standard chunk of
      Lorem Ipsum used since the 1500s is reproduced below for those interested.
      Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by
      Cicero are also reproduced in their exact original form, accompanied by
      English versions from the 1914 translation by H. Rackham.`;

const tokens: string[] = ["Words", "Things", "Names"];
const selections = ref<Selected[]>([]);
const selectedToken = ref("");
const classByToken = {
  Words: "hl",
  Things: "hl-2",
  Names: "hl-3",
};

type Dictionary = {
  [key: string]: Range[];
};

const hl: Dictionary = {};

function getSelectedText() {
  if (window.getSelection) {
    return window.getSelection();
  }
}

function selectToken(token: string) {
  selectedToken.value = token;
}

function highlightBySelection() {
  const selection = getSelectedText();
  if (selection?.type !== "Range" || !selectedToken.value) return;

  const from = selection.anchorOffset;
  const to = selection.focusOffset;

  const selected: Selected = {
    from,
    to,
    text: selection.toString(),
    token: selectedToken.value,
  };

  highlight(selected);

  selections.value.push(selected);
  localStorage.setItem("selection", JSON.stringify(selections.value));
}

function onClear() {
  localStorage.removeItem("selection");
  window.location.reload();
}

function highlight(selected: Selected) {
  if (!CSS.highlights) {
    alert("The CSS Custom Highlight API is not supported in this browser!");
  }

  const { from, to, token } = selected;
  const selection = getSelectedText()!;
  const node = document.getElementById("lorem")!;

  const range = document.createRange();
  range.setStart(node.firstChild!, from);
  range.setEnd(node.firstChild!, to);

  selection.addRange(range);
  if (!hl[token]) hl[token] = [];

  hl[token].push(range);

  selection.empty();

  applyHighlight();
}

function applyHighlight() {
  for (const iterator of Object.entries(hl)) {
    const [key, value] = iterator;
    const cl = classByToken[key as keyof typeof classByToken];

    CSS.highlights.set(cl, new Highlight(...value.flat()));
  }

  if (Object.keys(hl).length > 1) {
    document.getElementById("lorem")!.style.lineHeight = "1.5";
  }
  if (Object.keys(hl).length > 2) {
    document.getElementById("lorem")!.style.lineHeight = "2";
  }
}

function loadHighlight() {
  const savedSelections = localStorage.getItem("selection") ?? "[]";

  const parsedSavedSelections = JSON.parse(savedSelections);

  for (const selected of parsedSavedSelections) {
    highlight(selected);
    selections.value.push(selected);
  }
}

onMounted(() => {
  document.onmouseup = highlightBySelection;

  loadHighlight();
});
</script>
<style>
span {
  font-family: monospace;
  font-size: 17px;
}

::highlight(hl) {
  background-color: yellow;

  -webkit-text-decoration: darkturquoise solid underline;
  text-decoration: darkturquoise solid underline 6px;
  -webkit-text-decoration-skip: ink;
  text-decoration-skip-ink: auto;
}

::highlight(hl-2) {
  background-color: yellow;

  -webkit-text-decoration: rgb(185, 0, 209) solid underline;
  text-decoration: rgb(185, 0, 209) solid underline 5px;
  -webkit-text-decoration-skip: ink;
  text-decoration-skip-ink: auto;
}

::highlight(hl-3) {
  background-color: yellow;

  -webkit-text-decoration: #f60b26 solid underline;
  text-decoration: #f60b26 solid underline 4px;
  -webkit-text-decoration-skip: ink;
  text-decoration-skip-ink: auto;
}

.container {
  display: flex;
  flex-direction: row;
  gap: 5px;
}

.left {
  width: 50%;
}
.right {
  width: 50%;
}
</style>
