import {GEPTdb} from './GEPT.js'
import {KIDSdb} from './Kids.js'

const LEMMA = 0
const POS = 1
const LEVEL = 2
const NOTE = 3

const GEPTKids = {name:"GEPTKids", db:KIDSdb}
const GEPT = {name:"GEPT", db:GEPTdb}
let isGEPTKids = false

const legends = {
  term: "Search",
  match: "Match",
  level: "Level",
  //pos: "Part of speech:",
  theme: "Theme",
  pos: "PoS",
  results: "Results"
}

let currentDb = GEPT


const form = document.getElementById("main")
const results_text = document.getElementById("results_text")
const db_toggle = document.getElementById("term_slider")
const G_level = document.getElementById("level")
const K_theme = document.getElementById("theme")
const theme_select = document.getElementById("theme_select")
const root_css = document.documentElement;

addListeners()
finalInit()


// ***** INIT FUNCTIONS

function addListeners(){
  form.addEventListener("submit", logSubmit)
  form.addEventListener("reset", reset_form)
  db_toggle.addEventListener("change", refreshSliderWrapper)
  theme_select.addEventListener("change", updateLegendWrapper)
  
  for (const el of document.getElementsByTagName("input")) {
    if (el.type != "text") {
      el.addEventListener("change", clearDiffSiblings)
    }
  }
}

function finalInit(){ 
  refreshSlider(db_toggle)
  for (const key of Object.keys(legends)) {
    updateLegend(key)
  }
}



// *****  FUNCTIONS

function clearDiffSiblings(e) {
  const input = e.target
  const parentID = input.id.split("_")[0]
  for (const el of getInputs(parentID)) {
    if (el.type != input.type) { el.checked = false }
  }
  updateLegend(parentID)
}




function updateLegendWrapper() {
  updateLegend("theme")
}

function updateLegend(parentID) {
  let labelContent = []
  //console.log(`legend parent: ${parentID}`)
  if (parentID == "term") {
    labelContent = [` <span class='dbColor'>${currentDb.name}</span> for:`]
  } else {
    for (const el of getInputs(parentID)) {
      if (el.checked) { labelContent.push(el.labels[0].innerText) }
      else if (el.selected) {labelContent.push(el.innerHTML) }
    }
  }
  const label = document.getElementById(parentID + "_legend")
  label.innerHTML = `<strong>${legends[parentID]}</strong>: ${labelContent.join(" + ")}`
}






function getInputs(parentID) {
  let tag = "input"
  if (parentID == "theme") tag = "option"
  //console.log(parentID,tag)
  return document.getElementById(parentID).querySelectorAll(tag)
}






function logSubmit(event) {
  let results = []
  let raw_data = new FormData(form)
  event.preventDefault()

  let data = {
    term: [],
    match: [],
    level: [],
    theme: [],
    pos: []
  }
  for (const [key, value] of raw_data) {
    data[key].push(value)
  }

  let term = data.term.join().toLowerCase()
  let level = data.level.join("|")
  // ** Substitute theme data for level in GEPTKids search
  // ** otherwise theme data is disregarded
  if (isGEPTKids) {
    level = data.theme.join("|")
  }
  const pos = data.pos.join("|")
  const searchTerms = term + level + pos
  // console.log(`searchTerms=${searchTerms}`)
  if (!searchTerms) {
    results = ["Please enter at least one search term to restrict the number of results.",0]
  } else {
    switch (data.match.join()) {
      case "contains":
        //term = term
        break
      case "starts":
        term = "^" + term + ".*"
        break
      case "ends":
        term = ".*" + term + "$"
        break
      case "exact":
        term = "^" + term + "$"
        break
    }
    term = new RegExp(term, "i")
  
    results = get_results({
      term: term,
      level: level,
      pos: pos
    })

    results = [format_results(results),results.length]
  }
  display_results(results)
}





function get_results(find) {  
  //console.log(find,isGEPTKids,currentDb.name)
  let results = currentDb.db.filter((i) => i[LEMMA].search(find.term) != -1)
  if (find.level) {
    results = results.filter((i) => i[LEVEL].search(find.level) != -1)
  }
  if (find.pos) {
    results = results.filter((i) => i[POS].search(find.pos) != -1)
  }
  return results
}


function format_results(results) {
  return "<table>" + results
    .map(function (entry, i) {
      return `<tr><td>${i + 1
        }:</td><td><strong>${entry[LEMMA]}</strong> [${entry[POS]}] ${entry[LEVEL]}, ${entry[NOTE]}</td></tr>`
    })
    .join("") + "</table>"
}


function display_results(output) {
  let text = `<strong>${legends.results}</strong>`
  if (output[1]) {
    text += ` (${output[1]})`
  }
  results_legend.innerHTML = text
  results_text.innerHTML = output[0]
}



function reset_form() {
  form.reset()
  for (const key of Object.keys(legends)) {
    updateLegend(key)
  }
  results_text.innerHTML = ""
  refreshSlider(db_toggle)
}



function refreshSliderWrapper(e) {
  refreshSlider(e.target)
}

function refreshSlider(slider) {
  if (slider.checked) {
    //console.log("Using GEPTKids")
    G_level.style.display = "none"
    K_theme.style.display = "block"

    root_css.style.setProperty('--light', '#f9ccac')
    //root_css.style.setProperty('--light', '#b7d7e8')
    root_css.style.setProperty('--medium', '#f4a688')
    //root_css.style.setProperty('--dark', '#e0876a')
    root_css.style.setProperty('--dark', '#c1502e')
    root_css.style.setProperty('--accent', '#fbefcc')    
    currentDb = GEPTKids
    isGEPTKids = true
  } else {
    //console.log("Using GEPT")
    G_level.style.display = "block"
    K_theme.style.display = "none"
    root_css.style.setProperty('--light', '#cfe0e8')
    root_css.style.setProperty('--medium', '#87bdd8')
    root_css.style.setProperty('--dark', '#3F7FBF')
    root_css.style.setProperty('--accent', '#daebe8')
    currentDb = GEPT
    isGEPTKids = false
  }
}
