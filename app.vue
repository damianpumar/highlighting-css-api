<template>
  <div class="container">
    <div class="left">
      <h2>Text</h2>

      <div>
        <p>Tokens</p>
        <div class="entities">
          <p v-for="entity in entities" @click="highlighting.entity = entity">
            | {{ entity }} |
          </p>
          <p>Selected: {{ highlighting.entity }}</p>
        </div>
        <hr />

        <p>Replace last selection with:</p>
        <div class="entities">
          <p v-for="entity in entities" @click="replace(entity)">
            | {{ entity }} |
          </p>
        </div>
      </div>

      <div>
        <p>Config</p>
        <input
          type="checkbox"
          id="allowOverlap"
          v-model="highlighting.config.allowOverlap"
        />
        <label for="allowOverlap">Allow overlap</label>
        <br />
        <input
          type="checkbox"
          id="characterLevel"
          v-model="highlighting.config.allowCharacter"
        />
        <label for="characterLevel">Character level</label>
        <hr />
      </div>

      <span id="lorem" class="highlight__text" v-html="field"></span>
    </div>

    <div class="right">
      <h2>Json (Highlight object)</h2>
      <button @click="clearSelection()">Clear</button>
      <br />

      <span v-text="JSON.stringify(highlighting.spans)" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Highlighting } from "./highlighting";

const LOCAL_STORAGE_KEY = "selection";

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

const entities: string[] = ["Words", "Things", "Names", "Unknown"];

const classByGroup = entities.reduce((acc, token, i) => {
  acc[token] = `hl-${i + 1}`;
  return acc;
}, {} as Record<string, string>);

const highlighting = ref<Highlighting>(
  new Highlighting({
    entitiesCSS: classByGroup,
    entityClassName: "highlight__entity",
    entitiesGap: 9,
  })
);

const clearSelection = () => {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  highlighting.value.removeAllHighlights();
};

const loadSavedHighlight = () => {
  const selections = JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_KEY) ?? "[]"
  );

  highlighting.value.loadHighlights(selections);
};

const replace = (entity: string) => {
  const lastSpan =
    highlighting.value.spans[highlighting.value.spans.length - 1];

  highlighting.value.replaceEntity(lastSpan, entity);
};

watch(
  () => highlighting.value.spans,
  (selections) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(selections));
  }
);

onMounted(() => {
  const node = document.getElementById("lorem")!;
  highlighting.value.attachNode(node);
  highlighting.value.entity = entities[0];

  window.addEventListener("keydown", (e) => {
    if (e.key === "Alt") {
      highlighting.value.config.allowCharacter = true;
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "Alt") {
      highlighting.value.config.allowCharacter = false;
    }
  });

  loadSavedHighlight();
});
</script>
<style>
::selection {
  background-color: #f06;
  color: white;
}

::highlight(hl-1) {
  background-color: yellow;

  -webkit-text-decoration: darkturquoise solid underline;
  text-decoration: darkturquoise solid underline 3px;
  -webkit-text-decoration-skip: ink;
  text-decoration-skip-ink: auto;
}

::highlight(hl-2) {
  background-color: yellow;

  -webkit-text-decoration: rgb(185, 0, 209) solid underline;
  text-decoration: rgb(185, 0, 209) solid underline 3px;
  -webkit-text-decoration-skip: ink;
  text-decoration-skip-ink: auto;
}

::highlight(hl-3) {
  background-color: yellow;

  -webkit-text-decoration: #f60b26 solid underline;
  text-decoration: #f60b26 solid underline 3px;
  -webkit-text-decoration-skip: ink;
  text-decoration-skip-ink: auto;
}

::highlight(hl-4) {
  background-color: yellow;

  -webkit-text-decoration: #19eec0 solid underline;
  text-decoration: #19eec0 solid underline 3px;
  -webkit-text-decoration-skip: ink;
  text-decoration-skip-ink: auto;
}

.highlight__text {
  font-family: monospace;
  font-size: 17px;
  line-height: 2.5;
  cursor: text;
}

.highlight__entity {
  display: block;
  margin-top: 26px;
  font-size: 10px;
  position: absolute;
}

.entities {
  display: flex;
  flex-direction: row;
  gap: 5px;
  cursor: pointer;
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
./highlighting
