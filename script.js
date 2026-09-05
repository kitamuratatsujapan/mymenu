const DATA_URL = "menu.csv";
const IMAGE_DIR = "images/";

const CATEGORIES = [
  { key: "all", ch: "全部", jp: "すべて", en: "All" },
  { key: "凉菜", ch: "凉菜", jp: "冷菜", en: "Cold Dishes" },
  { key: "热菜-素", ch: "热菜-素", jp: "温菜・野菜", en: "Hot · Vegetable" },
  { key: "热菜-鸡肉", ch: "热菜-鸡肉", jp: "温菜・鶏肉", en: "Hot · Chicken" },
  { key: "热菜-猪肉", ch: "热菜-猪肉", jp: "温菜・豚肉", en: "Hot · Pork" },
  { key: "热菜-羊肉", ch: "热菜-羊肉", jp: "温菜・羊肉", en: "Hot · Lamb" },
  { key: "热菜-牛肉", ch: "热菜-牛肉", jp: "温菜・牛肉", en: "Hot · Beef" },
  { key: "热菜-海鲜", ch: "热菜-海鲜", jp: "温菜・海鮮", en: "Hot · Seafood" },
  { key: "热菜-其他", ch: "热菜-其他", jp: "温菜・その他", en: "Hot · Other" },
  { key: "主食", ch: "主食", jp: "主食", en: "Staples" },
  { key: "汤", ch: "汤", jp: "スープ", en: "Soup" },
  { key: "创意菜", ch: "创意菜", jp: "創作料理", en: "Creative" }
];

const UI = {
  ch: {
    title: "全部",
    empty: "暂无符合条件的菜品。",
    ingredients: "材料："
  },
  jp: {
    title: "すべて",
    empty: "該当する料理がありません。",
    ingredients: "材料："
  },
  en: {
    title: "All",
    empty: "No dishes found.",
    ingredients: "Ingredients: "
  }
};

let currentLang = "ch";
let currentCategory = "all";
let dishes = [];

const $ = (selector) => document.querySelector(selector);

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (c === "\r" && next === "\n") i++;
      row.push(field);
      if (row.some(v => v.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    if (row.some(v => v.trim() !== "")) rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map(h => h.trim().replace(/^\uFEFF/, ""));
  return rows.slice(1).map(values => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = (values[i] ?? "").trim());
    return obj;
  });
}

function escapeHTML(value = "") {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function getCategoryLabel(category) {
  const item = CATEGORIES.find(c => c.key === category);
  return item ? item[currentLang] : category;
}

function getCategoryText() {
  const item = CATEGORIES.find(c => c.key === currentCategory);
  return item ? item[currentLang] : UI[currentLang].title;
}

function renderCategories() {
  const container = $("#categoryList");

  container.innerHTML = CATEGORIES.map(category => `
    <button
      class="category-btn ${category.key === currentCategory ? "active" : ""}"
      data-category="${escapeHTML(category.key)}">
      ${escapeHTML(category[currentLang])}
    </button>
  `).join("");

  container.querySelectorAll(".category-btn").forEach(button => {
    button.addEventListener("click", () => {
      currentCategory = button.dataset.category;
      renderCategories();
      renderMenu();
    });
  });
}

function renderMenu() {
  const list = $("#menuList");
  const empty = $("#emptyMessage");

  const filtered = dishes
    .filter(dish => currentCategory === "all" || dish["カテゴリー"] === currentCategory)
    .sort((a, b) => Number(a["ソート順"] || 9999) - Number(b["ソート順"] || 9999));

  $("#menuTitle").textContent = getCategoryText();
  empty.textContent = UI[currentLang].empty;
  empty.hidden = filtered.length !== 0;

  const nameKey = `料理名${currentLang}`;
  const ingredientsKey = `材料${currentLang}`;
  const descriptionKey = `説明${currentLang}`;

  list.innerHTML = filtered.map(dish => {
    const photo = dish["写真ファイル名"];
    const imagePath = photo ? IMAGE_DIR + encodeURIComponent(photo) : "";

    return `
      <article class="menu-item">
        ${
          imagePath
            ? `<img class="menu-photo" src="${escapeHTML(imagePath)}"
                alt="${escapeHTML(dish[nameKey])}"
                loading="lazy"
                onerror="this.outerHTML='<div class=&quot;menu-photo photo-placeholder&quot;>NO PHOTO</div>'">`
            : `<div class="menu-photo photo-placeholder">NO PHOTO</div>`
        }
        <div class="menu-content">
          <div class="menu-title-row">
            <h2 class="dish-name">${escapeHTML(dish[nameKey])}</h2>
            <span class="category-label">${escapeHTML(getCategoryLabel(dish["カテゴリー"]))}</span>
          </div>
          <p class="ingredients">${escapeHTML(UI[currentLang].ingredients + (dish[ingredientsKey] || ""))}</p>
          <p class="description">${escapeHTML(dish[descriptionKey] || "")}</p>
        </div>
      </article>
    `;
  }).join("");
}

async function loadMenu() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const csvText = await response.text();
    dishes = parseCSV(csvText);
    renderCategories();
    renderMenu();
  } catch (error) {
    console.error(error);
    $("#menuList").innerHTML = "";
    $("#emptyMessage").hidden = false;
    $("#emptyMessage").textContent =
      "menu.csv を読み込めませんでした。GitHub Pages上で確認してください。";
  }
}

document.querySelectorAll(".lang-btn").forEach(button => {
  button.addEventListener("click", () => {
    currentLang = button.dataset.lang;

    document.documentElement.lang =
      currentLang === "ch" ? "zh-CN" :
      currentLang === "jp" ? "ja" : "en";

    document.querySelectorAll(".lang-btn").forEach(btn => {
      btn.classList.toggle("active", btn === button);
    });

    renderCategories();
    renderMenu();
  });
});

loadMenu();
