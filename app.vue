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

const field = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem Ipsum coreano: 국민경제의 발전을 위한 중요정책의 수립에 관하여 대통령의 자문에 응하기 위하여 국민경제자문회의를 둘 수 있다. Lorem Ipsum griego: Λορεμ ιπσθμ δολορ σιτ αμετ, νοvθμ φαβελλασ πετεντιθμ vελ νε, ατ νισλ σονετ οπορτερε εθμ. Αλιι δοcτθσ μει ιδ, νο αθτεμ αθδιρε ιντερεσσετ μελ, δοcενδι cομμθνε οπορτεατ τε cθμ. Lorem Ipsum japónes: 旅ロ京青利セムレ弱改フヨス波府かばぼ意送でぼ調掲察たス日西重ケアナ住橋ユムミク順待ふかんぼ人奨貯鏡すびそ。 Lorem Ipsum russo: Лорем ипсум долор сит амет, пер цлита поссит ех, ат мунере фабулас петентиум сит. Иус цу цибо саперет сцрипсерит, нец виси муциус лабитур ид. Ет хис нонумес нолуиссе дигниссим. Lorem Ipsum chino: 側経意責家方家閉討店暖育田庁載社転線宇。得君新術治温抗添代話考振投員殴大闘北裁。品間識部案代学凰処済準世一戸刻法分。悼測済諏計飯利安凶断理資沢同岩面文認革。内警格化再薬方久化体教御決数詭芸得筆代。 Lorem Ipsum hindi: पढाए हिंदी रहारुप अनुवाद कार्यलय मुख्य संस्था सोफ़तवेर निरपेक्ष उनका आपके बाटते आशाआपस मुख्यतह उशकी करता। शुरुआत संस्था कुशलता मेंभटृ अनुवाद गएआप विशेष सकते परिभाषित लाभान्वित प्रति देकर समजते दिशामे प्राप्त जैसे वर्णन संस्थान निर्माता प्रव्रुति भाति चुनने उपलब्ध बेंगलूर अर्थपुर्ण Lorem Ipsum armenio: լոռեմ իպսում դոլոռ սիթ ամեթ, լաբոռե մոդեռաթիուս եթ հաս, պեռ ոմնիս լաթինե դիսպութաթիոնի աթ, վիս ֆեուգաիթ ծիվիբուս եխ. վիվենդում լաբոռամուս ելաբոռառեթ նամ ին. Lorem Ipsum árabe: غينيا واستمر العصبة ضرب قد. وباءت الأمريكي الأوربيين هو به،, هو العالم، الثقيلة بال. مع وايرلندا الأوروبيّون كان, قد بحق أسابيع العظمى واعتلاء. انه كل وإقامة المواد. Lorem Ipsum ebreo: כדי יסוד מונחים מועמדים של, דת דפים מאמרשיחהצפה זאת. אתה דת שונה כלשהו, גם אחר ליום בשפות, או ניווט פולנית לחיבור ארץ. ויש בקלות ואמנות אירועים או, אל אינו כלכלה שתי.`;

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
