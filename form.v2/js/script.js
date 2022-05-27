if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/form.v2/sw.js')
    .then(reg => console.log('service worker registered'))
    .catch(err => console.log('service worker not registered', err));
}

const LEMMA = 0;
const POS = 1;
const LEVEL = 2;
const NOTE = 3;

const GEPT = {
  name: "GEPT",
  db: GEPTdb,
  isKids: false,
  css: ["#cfe0e8", "#87bdd8", "#3F7FBF", "#daebe8", 0]
};
const GEPTKids = {
  name: "GEPTKids",
  db: KIDSdb,
  isKids: true,
  css: ["#f9ccac", "#f4a688", "#c1502e", "#fbefcc", 36]
};

const legends = {
  term: "Search",
  match: "Match",
  level: "Level",
  theme: "Theme",
  pos: "PoS",
  results: "Results"
};

let currentDb = GEPT;

const form = document.getElementById("main");
const results_text = document.getElementById("results_text");
const title = document.getElementById("term_legend");
const knub = document.getElementById("knub");
//const knub = document.getElementById("knub");
const G_level = document.getElementById("level");
const K_theme = document.getElementById("theme");
//const theme_select = document.getElementById("theme_select");
const root_css = document.documentElement;

addListeners();
finalInit();

// ***** INIT FUNCTIONS

function addListeners() {
  form.addEventListener("submit", submitForm);
  form.addEventListener("reset", reset_form);
  document
    .getElementById("theme_select")
    .addEventListener("change", submitForm);
  document.getElementById("term_i").addEventListener("input", submitForm);

  document
    .getElementById("js_slider")
    .addEventListener("click", refreshSliderWrapper);

  for (const el of document.getElementsByTagName("input")) {
    //if (el.type != "text") el.addEventListener("click", clearDiffSiblings);
    if (el.type != "text") {
      const label = el.labels[0];
      if (label.htmlFor) label.addEventListener("click", registerLabelClick);
    }
  }
}

function finalInit() {
  toggleSlider(GEPT);
  refreshLabels("main");
}

// *****  FUNCTIONS

function registerLabelClick(e_label) {
  const label = e_label.target;
  if (label.htmlFor) {
    const input = document.getElementById(label.htmlFor);
    const parentID = label.htmlFor.split("_")[0];

    const allInputs = document
      .getElementById(parentID)
      .querySelectorAll("input");
    let defaultChecked;
    let countChecked = 0;

    allInputs.forEach((el) => {
      const el_label = el.labels[0];
      if (el.defaultChecked) defaultChecked = el;
      // LOGIC:
      // 1) clicked element must be checked
      // 2) de-select an already-checked input
      if (el.id == input.id) {
        if (input.checked) {
          input.checked = false;
          el_label.classList.remove("selected_txt");
        } else {
          el.checked = true;
          el_label.classList.add("selected_txt");
        }
      }
      // LOGIC: in a group, if 1 radio checked, all others unchecked
      // 1) if already radio selected, no others selections allowed
      // 2) if el is radio, then it can't be selected
      else if (input.type == "radio" || el.type == "radio") {
        el.checked = false;
        el_label.classList.remove("selected_txt");
      }
      // LOGIC: remaining checkboxes are unaffected
      if (el.checked) countChecked += 1;
    });
    //console.log(`r_l_Click: ${label.htmlFor} (${input.type}:${input.checked}) default:${defaultChecked.id} [${countChecked}]`);

    if (countChecked < 1) {
      defaultChecked.checked = true;
      defaultChecked.labels[0].classList.add("selected_txt");
      refreshLabels(parentID);
    }
    submitForm(e_label);
  }
}


function refreshLabels(parentID) {
  const allInputs = document.getElementById(parentID).querySelectorAll("input");
  allInputs.forEach((el) => {
    const label = el.labels[0];
    if (label) {
      if (el.defaultChecked) label.classList.add("selected_txt");
      else label.classList.remove("selected_txt");
    }
  });
}

function getInputs(parentID) {
  let tag = "input";
  if (parentID == "theme") tag = "option";
  return document.getElementById(parentID).querySelectorAll(tag);
}

function submitForm(event) {
  let results = [];
  let raw_data = new FormData(form);
  event.preventDefault();

  let data = {
    term: [],
    match: [],
    level: [],
    theme: [],
    pos: []
  };
  for (const [key, value] of raw_data) {
    data[key].push(value.trim());
  }
  console.log("Search for:" + JSON.stringify(data).replace(/[\[\]\{\}]/g, ""));
  //console.table(data);

  let term = data.term.join().toLowerCase();
  let level = data.level.join("|");
  // ** Substitute theme data for level in GEPTKids search
  // ** otherwise theme data is disregarded
  if (currentDb.isKids) level = data.theme.join("|");
  const pos = data.pos.join("|");
  const searchTerms = term + level + pos;
  if (!searchTerms) {
    results = [
      "Please enter at least one search term to restrict the number of results.",
      0
    ];
  } else {
    const terms = data.match.join().split(':')
    term = terms ? terms[0] + term + terms[1] : term;
    console.log(term)
    /*switch (data.match.join()) {
      case "contains":
        //term = term
        break;
      case "starts":
        term = "^" + term + ".*";
        break;
      case "ends":
        term = ".*" + term + "$";
        break;
      case "exact":
        term = "^" + term + "$";
        break;
    }*/
    term = new RegExp(term, "i");
    results = get_results({
      term: term,
      level: level,
      pos: pos
    });
    results = [format_results(results), results.length];
  }
  display_results(results);
}

function get_results(find) {
  let results = currentDb.db.filter((i) => i[LEMMA].search(find.term) != -1);
  if (find.level)
    results = results.filter((i) => i[LEVEL].search(find.level) != -1);
  if (find.pos) results = results.filter((i) => i[POS].search(find.pos) != -1);
  return results;
}

function format_results(results) {
  return (
    "<table>" +
    results
      .map(function (entry, i) {
        return `<tr><td>${i + 1
          }:</td><td><strong>${entry[LEMMA]}</strong> [${entry[POS].trim()}] ${entry[LEVEL].trim()}, ${entry[NOTE].trim()}</td></tr>`;
      })
      .join("") +
    "</table>"
  );
}

function display_results(output) {
  let text = `${legends.results}`;
  if (output[1]) text += ` (${output[1]})`;
  results_legend.innerHTML = text;
  results_text.innerHTML = output[0];
}

function reset_form() {
  form.reset;
  display_results([]);
  refreshLabels("main");
  results_text.innerHTML = "";
}

function refreshSliderWrapper(event) {
  refreshSlider(event.target);
    submitForm(event);
}

function refreshSlider(slider) {
  if (!currentDb.isKids) toggleSlider(GEPTKids);
  else toggleSlider(GEPT);
}

function toggleSlider(dBase) {
  currentDb = dBase;
  title.innerHTML = `Search <span class='dbColor'>${dBase.name}</span> for:`;
  if (currentDb.isKids) {
    K_theme.style.setProperty("display", "block");
    G_level.style.setProperty("display", "none");
  } else {
    K_theme.style.setProperty("display", "none");
    G_level.style.setProperty("display", "block");
  }
  root_css.style.setProperty("--light", dBase.css[0]);
  root_css.style.setProperty("--medium", dBase.css[1]);
  root_css.style.setProperty("--dark", dBase.css[2]);
  root_css.style.setProperty("--accent", dBase.css[3]);
  knub.style.transform = `translateX(${dBase.css[4]}px)`;
  //updateLegend("term");
}
