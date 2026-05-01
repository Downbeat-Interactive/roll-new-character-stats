import { RegisteredSettings } from "../registered-settings.js";
import GAME_SYSTEM_Helper from "../../data/game-system-helper.js";
import dnd5e_ActorHelper from "../helpers/dnd5e-actor-helper.js";
import pf1_ActorHelper from "../helpers/pf1-actor-helper.js";
import ose_ActorHelper from "../helpers/ose-actor-helper.js";
import archmage_ActorHelper from "../helpers/archmage-actor-helper.js";
import dcc_ActorHelper from "../helpers/dcc-actor-helper.js";
import osric_ActorHelper from "../helpers/osric-actor-helper.js";
import fd_ActorHelper from "../helpers/fd-actor-helper.js";

const game_system_helper = new GAME_SYSTEM_Helper();

Hooks.on('renderConfigureActor', () => {
    Initialize();
});

let individual_rolls = null;
let individual_rolls_remaining = null;
let ring_start = 0;

function Initialize() {

    // Apply as Rolled?
    const ability_scores = document.getElementById("ability_scores");
    if (!ability_scores) return;
    RegisterDragStartHandlers();
    RegisterRingWheelHandler();
    HideResultsZone(ability_scores.dataset.hideresultszone === "true")
    HideRingMethodZone(ability_scores.dataset.distributionmethod !== "ring-method");
    HideBonusPointColumn(ability_scores.dataset.bonus_points === "0" && ability_scores.dataset.distributionmethod !== "point-buy-method");
    if(ability_scores.dataset.distributionmethod === "apply-as-rolled" || ability_scores.dataset.distributionmethod === "point-buy-method"){
        ApplyAsRolled();
    }

    // Wrap this in Ring Method setting
    if(ability_scores.dataset.distributionmethod === "ring-method"){ // Ring Method
        const individual_rolls_table = document.getElementById("individual_rolls_table");
        individual_rolls = individual_rolls_table.dataset.individualrolls.split(',');
        individual_rolls_remaining = {rolls:[]};
        for(let i = 0; i < individual_rolls.length; i += 1)
        {
            individual_rolls_remaining.rolls.push({value: individual_rolls[i], index: i})
        }
        FillRingItemAdders();
        GetSelectedRingTotal();
        HighlightIndividualRolls();
    }
    // Wrap this in Ring Method setting

    // Game System Specific Configuration
    // If there are no bonus points, and results are applied as rolled, then we can hide the Score column - because the Result col IS the Score.
    let hide_score_col = ability_scores.dataset.bonus_points === "0" && ability_scores.dataset.distributionmethod === "apply-as-rolled"
    switch (game.system.id) {

        case "dnd5e":
        case "fantastic-depths":
            // Always show Score column because players can select Race during Configuration
            if (ability_scores.dataset.hideracebonuscolumn === "true") {
                HideRaceOptions();
            }
            break;
        case "pf1":
            HideScoreColumn(hide_score_col);
            break;
        case "ose":
            HideRaceOptions();
            HideScoreColumn(hide_score_col);
            break;
        case "archmage":
            HideRaceOptions();
            HideScoreColumn(hide_score_col);
            break;
        case "dcc":
            HideRaceOptions();
            HideScoreColumn(hide_score_col);
            let dcc_description = document.getElementById("dcc_description");
            dcc_description.innerHTML = dcc_description.dataset.dcc_description;
            break;
        case "osric":
            HideRaceOptions();
            HideScoreColumn(hide_score_col);
            HideAbilityModifierColumn();
            break;
        default:
            break;
    }
}

function HideResultsZone(hide) {
    if (hide) { document.getElementById("results_table")?.classList.add("rncs-display-none"); }
}

function HideRingMethodZone(hide) {
    if (hide) { document.getElementById("individual_rolls_table")?.classList.add("rncs-display-none"); }
}

function HideRaceOptions() {
    // Hide Race selector and Race Bonus column
    document.getElementById("race-selector")?.classList.add("rncs-display-none");
    HideColumn(".rncs-race-mod-header", ".rncs-racial-mod");
}

function HideRaceBonusColumn() {
    // Hide Race Bonus column only (keep species selector visible for flavor)
    HideColumn(".rncs-race-mod-header", ".rncs-racial-mod");
}

function HideBonusPointColumn(hide) {
    if (hide) { HideColumn(".rncs-bonus-header", ".rncs-bonus-points"); }
}

function HideScoreColumn(hide) {
    if (hide) { HideColumn(".rncs-score-header", ".rncs-final-score"); }
}

function HideAbilityModifierColumn() {
    HideColumn(".rncs-modifier-header", ".rncs-modifier");
}

function HideColumn(table_header_class, table_data_class) {
    const ability_scores = document.getElementById("ability_scores");
    if (!ability_scores) return;
    ability_scores.querySelector(".rncs-header-row").querySelector(table_header_class)?.classList.add("rncs-display-none");
    const ability_rows = ability_scores.querySelectorAll(".rncs-ability-row")
    for (let row = 0; row < ability_rows.length; row += 1) {
        const ability_row = document.getElementById(ability_rows[row].id);
        ability_row.querySelector(table_data_class)?.classList.add("rncs-display-none");
    }
}

function dragstart_handler(ev) {
    ev.dataTransfer.setData("text/plain", ev.target.parentElement);
    ev.dataTransfer.setData("text/plain", ev.target.innerText); // value of element being dragged
    ev.dataTransfer.setData("text/plain", ev.target.id);        // id of element being dragged
    ev.dataTransfer.dropEffect = "copy";
}

function dragover_handler(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "copy";
}

function RegisterDragStartHandlers() {
    document.querySelectorAll(".rncs-ability-drop-item, .rncs-ring-ability-drop-item, .rncs-variant-mod-drop-item").forEach(item => {
        item.addEventListener("dragstart", dragstart_handler);
    });
}

function RegisterRingWheelHandler() {
    const individual_rolls_table = document.getElementById("individual_rolls_table");
    if (!individual_rolls_table) return;
    individual_rolls_table.removeEventListener("wheel", ringWheelHandler);
    individual_rolls_table.addEventListener("wheel", ringWheelHandler);
}

function ringWheelHandler(e) {
    const ring_reverse = game.settings.get("roll-new-character-stats", "ReverseRingMethodScrolling");
    // TODO: Simplify
    if (e.deltaY > 0) {
        if (!ring_reverse) {
            ring_start = (ring_start + 1 === individual_rolls_remaining.rolls.length ? 0 : ring_start + 1)%individual_rolls_remaining.rolls.length;
        } else {
            ring_start = (ring_start - 1 === -1 ? individual_rolls_remaining.rolls.length - 1 : ring_start - 1)%individual_rolls_remaining.rolls.length;
        }
    } else {
        if (!ring_reverse) {
            ring_start = (ring_start - 1 === -1 ? individual_rolls_remaining.rolls.length - 1 : ring_start - 1)%individual_rolls_remaining.rolls.length;
        } else {
            ring_start = (ring_start + 1 === individual_rolls_remaining.rolls.length ? 0 : ring_start + 1)%individual_rolls_remaining.rolls.length;
        }
    }

    FillRingItemAdders();
    GetSelectedRingTotal();
    HighlightIndividualRolls(false);
}

function drop_handler(ev) {

    ev.preventDefault();
    const data = ev.dataTransfer.getData("text/plain");
    const drop_item_id = document.getElementById(data).id
    const drop_item_orig_parent = document.getElementById(data).parentElement;
    const drop_zone = document.getElementById(ev.target.id);

    // Drop result in ability_drop_zone or results_drop_zone or swap results (prevent dropping multiple in one zone)
    if (drop_item_id.includes("div_final_result") || drop_item_id.includes("div_ring_final_result")) {

        if (drop_zone.id === "results_drop_zone" || (drop_zone.id.includes("ability_drop_zone") && !drop_zone.querySelector(".rncs-ability-drop-item") && !drop_zone.querySelector(".rncs-ring-ability-drop-item"))) {
            let result_item = document.getElementById(data)
            if(result_item.parentElement.id === "rncs_ring_container_ability_total"){
                UpdateRing(result_item);
            }
            drop_zone.appendChild(result_item);
        }
        else if (drop_zone.id.includes("div_final_result")  || drop_zone.id.includes("div_ring_final_result")) {// Dropping onto existing result in any zone will swap values

            // Swap Results
            const ability_item_drop_zone = drop_zone.parentElement;
            drop_item_orig_parent.appendChild(drop_zone);
            ability_item_drop_zone.appendChild(document.getElementById(data));
        }
    }// Drop variant ability score increase modifier
    else if(drop_item_id.includes("div_variant_mod")){
        if(drop_zone.id.includes("racial_mod") && !drop_zone.querySelector(".rncs-variant-mod-drop-item"))//(prevent dropping multiple in one zone)
        {
            let variant_mod = document.getElementById(data)
            drop_zone.appendChild(variant_mod);
        }
        else if (drop_zone.id.includes("div_variant_mod")) {// Dropping onto existing variant_mod in Racial Bonus Zone will swap values

            // Swap values
            const variant_item_drop_zone = drop_zone.parentElement;
            drop_item_orig_parent.appendChild(drop_zone);
            variant_item_drop_zone.appendChild(document.getElementById(data));
        }
    }
    RecalcFinalScores();
}

// Increment or Decrement ability with Bonus Points
// For point-buy-method, uses 5e PHB scaling: scores 8-13 cost 1 pt each,
// 14 costs 2 pts extra (7 total), 15 costs 2 pts extra (9 total). Max score is 15.
function getPointBuyCost(currentScore) {
    if (currentScore >= 15) return null;         // already at max (15); + not allowed
    if (currentScore >= 13) return 2;            // 13→14 or 14→15 costs 2 points
    return 1;                                    // 8→13 costs 1 point per step
}

function getPointBuyRefund(currentScore) {
    if (currentScore <= 8) return 0;   // already at minimum
    if (currentScore > 13) return 2;   // decreasing from 14 or 15 refunds 2 points
    return 1;
}

function BPchange(ev) {
    const bp_button = document.getElementById(ev.target.id);
    const bp_points = bp_button.parentElement.querySelector(".rncs-bp");
    const bp_points_value = parseInt(bp_points.innerText);
    const span_bp_max = document.getElementById("span_bp_max");
    const span_bp_remaining = document.getElementById("span_bp_remaining");
    const bp_max = parseInt(span_bp_max.innerText);
    let bp_remaining = parseInt(span_bp_remaining.innerText);

    const ability_scores = document.getElementById("ability_scores");
    const isPointBuy = ability_scores.dataset.distributionmethod === "point-buy-method";

    if (bp_button.id.includes("minus") && bp_points_value > 0) {

        // In point-buy mode, refund the scaled cost of the last increment
        const refund = isPointBuy ? getPointBuyRefund(8 + bp_points_value) : 1;
        bp_points.innerText = Math.max(0, bp_points_value - 1);
        bp_remaining = Math.min(bp_remaining + refund, bp_max);
        span_bp_remaining.innerText = bp_remaining;

    } else if (bp_button.id.includes("plus")) {

        const cost = isPointBuy ? getPointBuyCost(8 + bp_points_value) : 1;
        if (cost !== null && bp_remaining >= cost) {
            bp_points.innerText = bp_points_value + 1;
            bp_remaining -= cost;
            span_bp_remaining.innerText = bp_remaining;
        }
    }
    RecalcFinalScores();
}

function RecalcFinalScores() {

    // Get rows from ability scores table
    const ability_scores = document.getElementById("ability_scores");
    const ability_rows = ability_scores.querySelectorAll(".rncs-ability-row");
    let over18NotAllowed = ability_scores.dataset.over18allowed === "false" && (ability_scores.dataset.distributionmethod !== "apply-as-rolled" || ability_scores.dataset.bonus_points > 0);

    let score_over_18 = false;
    for (let row = 0; row < ability_rows.length; row += 1) {

        const ability_row = document.getElementById(ability_rows[row].id);
        let ability_drop_item = ability_row.querySelector(".rncs-ability-drop-zone").querySelector(".rncs-ability-drop-item");
        if(!ability_drop_item){
            ability_drop_item = ability_row.querySelector(".rncs-ability-drop-zone").querySelector(".rncs-ring-ability-drop-item");
        }
        const bonus_points = ability_row.querySelector(".rncs-bonus-points").querySelector(".rncs-bp");
        const racial_mod = ability_row.querySelector(".rncs-racial-mod");
        const final_score_unmod = ability_row.querySelector(".rncs-final-score-unmod");
        const final_score_display = ability_row.querySelector(".rncs-final-score-display");
        const modifier = ability_row.querySelector(".rncs-modifier");
        const ability_text = ability_row.querySelector(".rncs-ability-text").innerText.toLowerCase()

        // Calculate final score
        const final_result = parseInt(ability_drop_item ? ability_drop_item.innerText : 0);
        const bonus_result = parseInt(bonus_points.innerText);
        const racial_mod_result = parseInt(racial_mod.innerText.length > 0 ? racial_mod.innerText : "0");
        final_score_unmod.value = final_result + bonus_result;// Exclude racial modifiers
        final_score_display.value = final_result + bonus_result + racial_mod_result;

        // Calculate ability modifier
        let ability_mod = 0;
        switch (game.system.id) {
            case "dnd5e":
            case "pf1":
            case "archmage":
            case "ose":
            case "fantastic-depths":
            case "osric":
                ability_mod = Math.floor((final_score_display.value - 10) / 2);
                break;
            case "dcc":
                ability_mod = CONFIG.DCC.abilityModifiers[final_score_display.value];
                break;
            default:
                ability_mod = Math.floor((final_score_display.value - 10) / 2);
        }
        modifier.value = (ability_mod > 0 ? "+" : "") + ability_mod;

        // Set hp modifier
        const hp_modifier_ability = document.getElementById("hp_modifier_ability");
        const hp_modifier = document.getElementById("hp_modifier");
        if (hp_modifier_ability.value === ability_text) { hp_modifier.value = modifier.value; }

        // TODO-LOW: Validation for score over 18 is still kinda sucky
        score_over_18 = (final_score_display.value > 18 ? true : score_over_18);
        over18NotAllowed = (score_over_18 && over18NotAllowed ? true : over18NotAllowed);
        if (final_score_display.value > 18 && over18NotAllowed) {
            final_score_display.classList.add("rncs-over18");
        } else {
            final_score_display.classList.remove("rncs-over18");
        }
    }

    // Enable/Disable submit Button
    // character_name has nothing to do with scores, I am just being lazy with submit.disable
    const character_name = document.getElementById("character_name");
    const span_bp_remaining = document.getElementById("span_bp_remaining");
    const submit = document.getElementById("submit");
    const bp_remaining = parseInt(span_bp_remaining.innerText);
    submit.disabled = (character_name.value.length === 0 || GetNextEmptyDropZone(".rncs-ability-drop-zone") || bp_remaining > 0 || (score_over_18 && over18NotAllowed));
}

async function MoveResult(ev) {
    const result_item = document.getElementById(ev.target.id);
    const results_drop_zone = document.getElementById("results_drop_zone");
    if (result_item.parentElement.id === "results_drop_zone" || result_item.parentElement.id === "rncs_ring_container_ability_total") {

        const next_ability = GetNextEmptyDropZone(".rncs-ability-drop-zone");
        // Update ring and get new total
        if(next_ability && result_item.parentElement.id === "rncs_ring_container_ability_total")
        {
            UpdateRing(result_item);
        }

        // Move result_item to next empty ability drop zone
        if (next_ability) {
            await next_ability.appendChild(result_item);
        }
    }
    else if (results_drop_zone && !result_item.id.includes("div_ring_final_result")) {
        await results_drop_zone.appendChild(result_item);
    }
    RecalcFinalScores();
}

function GetNextEmptyDropZone(drop_zone_class) {
    const ability_scores = document.getElementById("ability_scores");
    const ability_rows = ability_scores.querySelectorAll(".rncs-ability-row")
    for (let row = 0; row < ability_rows.length; row += 1) {
        const ability_row = document.getElementById(ability_rows[row].id);
        const target_drop_zone = ability_row.querySelector(drop_zone_class)
        if (target_drop_zone.innerText === "") {
            return target_drop_zone;
        }
    }
    return false;
}

function ApplyAsRolled() {
    const results_drop_zone = document.getElementById("results_drop_zone");
    const ability_drop_items = results_drop_zone.querySelectorAll(".rncs-ability-drop-item");
    for (let item = 0; item < ability_drop_items.length; item += 1) {
        const next_ability = GetNextEmptyDropZone(".rncs-ability-drop-zone");
        if (next_ability) {
            ability_drop_items[item].removeAttribute("ondblclick");
            ability_drop_items[item].removeAttribute("draggable");
            next_ability.appendChild(ability_drop_items[item]);
        }
    }
    results_drop_zone.innerHTML = "<small><em>" + game.i18n.localize("RNCS.form-app.form-text.applied-as-rolled") + "</em></small>";
    RecalcFinalScores();
}

async function UpdateRaceBonus(ev) {
    const ability_scores = document.getElementById("ability_scores");
    if (!ability_scores) return;

    // In 2024 mode, species do not grant ability score bonuses
    if (ability_scores.dataset.hideracebonuscolumn === "true") {
        RecalcFinalScores();
        return;
    }
    // Get racial bonuses
    const select = document.getElementById(ev.target.id);
    const jsonDATA = await getJSONData("./modules/roll-new-character-stats/data/character-properties.json");
    let race_bonuses;
    switch (game.system.id) {
        case "dnd5e":
            race_bonuses = jsonDATA.game_system[0].dnd5e.races[select.selectedIndex]
            break;
        case "pf1":
            race_bonuses = jsonDATA.game_system[0].pf1.races[select.selectedIndex]
            break;
        // case "ose":
        //     race_bonuses = jsonDATA.game_system[0].ose.races[select.selectedIndex]
        //     break;
        // case "archmage":
        //     race_bonuses = jsonDATA.game_system[0].archmage.races[select.selectedIndex]
        //     break;
        default:// Default to dnd5e for now
            race_bonuses = jsonDATA.game_system[0].dnd5e.races[select.selectedIndex]
    }

    // Update Race Bonus column
    // TODO-LOW: Allow hybrid - some hard wired ASI and some variant ASI
    const ability_rows = ability_scores.querySelectorAll(".rncs-ability-row")
    for (let row = 0; row < ability_rows.length; row += 1) {
        const ability_row = document.getElementById(ability_rows[row].id);
        const racial_mod = ability_row.querySelector(".rncs-racial-mod");
        if(race_bonuses.asi_any.length === 0){
            const ability_text = ability_row.querySelector(".rncs-ability-text").innerText.toLowerCase();
            racial_mod.innerText = race_bonuses[ability_text];
        }
        else{
            // Clear current innerText
            racial_mod.innerText = "";

            // Add next asi_any bonus drag-n-drop item to Race Bonus column
            const variant_mod = document.createElement("div");
            variant_mod.id = "div_variant_mod_" + Math.random().toString(36).slice(2);
            variant_mod.setAttribute("draggable", "true");
            variant_mod.classList.add("rncs-variant-mod-drop-item");
            variant_mod.addEventListener("dragstart", dragstart_handler);
            if(race_bonuses.asi_any[row]){
                variant_mod.innerText = (race_bonuses.asi_any[row]);
                racial_mod.appendChild(variant_mod);
            }
        }
    }

    RecalcFinalScores();
}

// Had trouble importing json-helper.js to template.
async function getJSONData(filename) {
    const jsonDATA = await fetch(filename)
        .then(response => response.json())
        .then(data => {
            return data;
        });
    return jsonDATA;
}

function FillRingItemAdders(){

    // Clear ring adders
    for(const ring_item_adder of document.getElementsByClassName("rncs-ring-item-adder")) { ring_item_adder.innerText = ""; }

    // Fill ring item adders
    if(individual_rolls_remaining.rolls.length > 0)
    {
        let adder_position = 0;
        for(const ring_item_adder of document.getElementsByClassName("rncs-ring-item-adder")) {
            let individual_roll_value = individual_rolls_remaining.rolls[(ring_start + adder_position)%individual_rolls_remaining.rolls.length]?.value;
            ring_item_adder.innerText = individual_roll_value
            adder_position += 1;
        }
    }
}

function GetSelectedRingTotal(){

    // Total of the three dice in ring item adders
    let total = 0;
    for(const ring_item_adder of document.querySelectorAll(".rncs-ring-item-adder")){ total += parseInt(ring_item_adder.innerText); }

    // Set div_ring_final_result to total (or empty)
    const ring_item_total = document.getElementById("div_ring_final_result");
    ring_item_total.innerText = (total > 0 ? total : "");

    // Make sure div_ring_final_result is draggable (or not if empty)
    if (total > 0 && GetNextEmptyDropZone(".rncs-ability-drop-zone")) {
        ring_item_total.addEventListener("dragstart", dragstart_handler);
    }else{
        ring_item_total.removeAttribute("ondblclick")
        ring_item_total.removeAttribute("draggable");
    }
}

async function UpdateRing(result_item) {
    // Create result_item_new to take place of moved result_item
    // Not sure if this needs to be done this way, but I don't know of another way to make the
    // item draggable, and remain in place for the new value when it is dragged and dropped or double clicked for MoveResult().
    const rncs_ring_container_ability_total = document.getElementById(result_item.parentElement.id);
    const result_item_new = result_item.cloneNode(false);
    await rncs_ring_container_ability_total.appendChild(result_item_new);

    // rename result_item to distinguish it from new result_item_new
    result_item.id += "-" + Math.random().toString(36).slice(2);

    // Remove items from ring and update ring_start
    // This looks a little crazy, but if - for example - the last two die
    // and the first die are selected - we want to make sure we get the correct
    // next three die - so we can't just splice the next three items in the array
    if (individual_rolls_remaining.rolls.length - ring_start >= 3) {
        individual_rolls_remaining.rolls.splice(ring_start, 3);
        ring_start = (ring_start)%individual_rolls_remaining.rolls.length;
    } else {
        let diff = individual_rolls_remaining.rolls.length - ring_start;
        individual_rolls_remaining.rolls.splice(ring_start, diff);
        individual_rolls_remaining.rolls.splice(0, 3 - diff);
        ring_start = 0;// Since we are splicing from both ends of individual_rolls_remaining, the new ring_start will be 0
    }

    FillRingItemAdders();
    GetSelectedRingTotal();
    HighlightIndividualRolls(true);
}

function HighlightIndividualRolls(highlight_used){

    // Remove rncs-ring-selection (& highlight used rolls)
    for(const individual_roll_item of document.querySelectorAll(".rncs-individual-roll")){
        if(highlight_used && individual_roll_item.classList.contains("rncs-ring-selection")){
            individual_roll_item?.classList.add("rncs-individual-roll-used")
        }
        individual_roll_item.classList.remove("rncs-ring-selection");
    }

    // Add rncs-ring-selection
    for(let j = 0; j < 3; j += 1){
        let selected_index = (ring_start + j === individual_rolls_remaining.rolls.length ? 0 : ring_start + j)%individual_rolls_remaining.rolls.length;
        const individual_roll_item = document.getElementById("rncs_individual_rolls" + individual_rolls_remaining.rolls[selected_index]?.index)
        individual_roll_item?.classList.add("rncs-ring-selection");
    }
}

window.Initialize = Initialize;
window.MoveResult = MoveResult;
window.BPchange = BPchange;
window.UpdateRaceBonus = UpdateRaceBonus;
window.RecalcFinalScores = RecalcFinalScores;
window.drop_handler = drop_handler;
window.dragover_handler = dragover_handler;

export class ConfigureActor extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

    // Properties
    _settings = new RegisteredSettings;

    static DEFAULT_OPTIONS = {
        id: "configure-actor",
        tag: "form",
        window: { title: "RNCS.dialog.results-button.configure-new-actor" },
        form: { handler: ConfigureActor._onSubmit, closeOnSubmit: true },
        position: { height: 610, width: 375 }
    };

    static PARTS = {
        form: { template: "./modules/roll-new-character-stats/templates/form-apps/configure-actor.hbs" }
    };

    constructor(owner_id, final_results, bonus_points, other_properties_results, individual_rolls, Over18Allowed, DistributionMethod, HideResultsZone) {
        super({});
        this.owner_id = owner_id,
        this.final_results = final_results,
        this.bonus_points = bonus_points,
        this.other_properties_results = other_properties_results,
        this.individual_rolls = individual_rolls,
        this.Over18Allowed = Over18Allowed,
        this.DistributionMethod = DistributionMethod,
        this.HideResultsZone = HideResultsZone
    }

    // Send data to Configure Actor form
    async _prepareContext(options) {

        // Use [game-system]-actor-handler class roll "other properties" to be displayed on form application.
        // these are only necessary if enhanced support is intended
        // let dnd5e_actor_helper = null;      // For future use
        // let pf1_actor_helper = null;        // For future use
        // let ose_actor_helper = null;        // For future use
        // let archmage_actor_helper = null;   // For future use
        let dcc_actor_helper = null;

        // Roll/Set "Other Properties"
        let character_name = "New Actor";
        let description = "";
        let hp_base = 1;
        let hp_modifier_ability = "con";
        let currency_pp = 0;
        let currency_ep = 0;
        let currency_gp = 0;
        let currency_sp = 0;
        let currency_cp = 0;

        switch (game.system.id) {
            case "dnd5e":
                break;
            case "pf1":
                break;
            case "ose":
                break;
            case "archmage":
                break;
            case "osric":
                break;
            case "fantastic-depths":
                break;
            case "dcc":

                // Actor document is not passed in at this time since one will not be created until player accepts the new actor
                // other_properties_results contains the player's rolls for properties such as hp, occupation, equipment, luck etc.
                dcc_actor_helper = new dcc_ActorHelper(null, this.other_properties_results, this.owner_id);

                // Roll/Set common properties
                hp_base = dcc_actor_helper._RollBaseHitPoints("1d4"); // default formula provided in case no other_properties_results provided
                hp_modifier_ability = dcc_actor_helper._hp_modifier_ability;
                currency_cp = dcc_actor_helper._RollStartingMoney("5d12","cp");  // default formula provided in case no other_properties_results provided

                // Roll/Set system unique properties
                dcc_actor_helper.stamina_modifier = CONFIG.DCC.abilityModifiers[this.final_results[2]];// Stamina Modifier
                dcc_actor_helper.luck_modifier = CONFIG.DCC.abilityModifiers[this.final_results[5]];// Luck Modifier
                await dcc_actor_helper.RollOccupation();    // No return value - set internaly and passed to form application
                await dcc_actor_helper.RollEquipment();     // No return value - set internaly and passed to form application
                await dcc_actor_helper.RollLuck();          // No return value - set internaly and passed to form application

                // Build description
                description = dcc_actor_helper.BuildDescription();

                // Get name
                character_name = dcc_actor_helper._character_name;

                break;
            default:
        }

        return {
            // Data passed to ConfigureActor form application
            final_results: this.final_results,
            bonus_points: this.bonus_points,
            individual_rolls: this.individual_rolls.map(x => x.result),
            Over18Allowed: this.Over18Allowed,
            DistributionMethod: this.DistributionMethod,
            hide_racial_bonus: game.system.id === "dnd5e" && this._settings.DnD5eRuleset === "2024",
            HideResultsZone: this.HideResultsZone,

            // BEGIN Common Character data
            character_name: character_name,
            description: description,
            hp_base: hp_base,
            hp_modifier_ability: hp_modifier_ability,
            currency_cp: currency_cp,
            // END Common Character data

            // BEGIN Game System Unique data
            // dnd5e
            is_dnd5e: game.system.id === "dnd5e",

            // pf1
            is_pf1: game.system.id === "pf1",

            // archmage
            is_archmage: game.system.id === "archmage",

            // ose
            is_ose: game.system.id === "ose",

            // fantastic-depths
            is_fantastic_depths: game.system.id === "fantastic-depths",

            // osric
            is_osric: game.system.id === "osric",

            // dcc
            is_dcc: game.system.id === "dcc",
            dcc_occupation: dcc_actor_helper?.occupation,
            dcc_occupation_desc: dcc_actor_helper?.occupation_desc,
            dcc_farmer_type: dcc_actor_helper?.farmer_type,
            dcc_trade_good: dcc_actor_helper?.trade_good,
            dcc_farm_animal: dcc_actor_helper?.farm_animal,
            dcc_cart_content: dcc_actor_helper?.cart_content,
            dcc_equipment: dcc_actor_helper?.equipment,
            dcc_luck: dcc_actor_helper?.luck,
            dcc_trade_weapon: dcc_actor_helper?.trade_weapon,
            dcc_trade_weapon_ammo: dcc_actor_helper?.trade_weapon_ammo,
            dcc_trade_weapon_ammo_qty: dcc_actor_helper?.trade_weapon_ammo_qty,
            // END Game System Unique data

            // Async data
            abilities: await game_system_helper.getSystemAbilities(),
            races: await game_system_helper.getSystemRaces()
        };
    }

    static async _onSubmit(event, form, formData) {

        const owner = this.owner_id;
        const data = formData.object;
        const actorRaceName = game.system.id === "dnd5e" && this._settings.DnD5eRuleset === "2024" ? "" : data.select_race;
        let actor = await Actor.create({
            name: ((data.character_name === "New Actor" || data.character_name === "") && actorRaceName ? actorRaceName : data.character_name),
            permission: { [owner]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
            type: game_system_helper.getSystemActorType(),
            img: "icons/svg/mystery-man.svg"
        });

        // Use [game-system]-actor-helper class to update actor
        switch (game.system.id) {
            case "dnd5e":
                let dnd5e_actor_helper = new dnd5e_ActorHelper(actor);
                dnd5e_actor_helper._Update(data);
                break;
            case "pf1":
                let pf1_actor_helper = new pf1_ActorHelper(actor);
                pf1_actor_helper._Update(data);
                break;
            case "ose":
                let ose_actor_helper = new ose_ActorHelper(actor);
                ose_actor_helper._Update(data);
                break;
            case "archmage":
                let archmage_actor_helper = new archmage_ActorHelper(actor);
                archmage_actor_helper._Update(data);
                break;
            case "dcc":
                let dcc_actor_helper = new dcc_ActorHelper(actor);
                dcc_actor_helper._Update(data);
                break;
            case "osric":
                let osric_actor_helper = new osric_ActorHelper(actor);
                osric_actor_helper._Update(data);
                break;
            case "fantastic-depths":
                let fd_actor_helper = new fd_ActorHelper(actor);
                fd_actor_helper._Update(data);
                break;
            default:
        }
    }
}

window.ConfigureActor = ConfigureActor;
