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

function getFormObject(form) {
    return Object.fromEntries(new FormData(form).entries());
}

export class ConfigureActor extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

    // Properties
    _settings = new RegisteredSettings;
    _individualRolls = null;
    _individualRollsRemaining = null;
    _ringStart = 0;

    static get DEFAULT_OPTIONS() {
        return {
            id: "configure-actor",
            window: { title: game.i18n.localize("RNCS.dialog.results-button.configure-new-actor") },
            position: { height: 610, width: 375 }
        };
    }

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

        const hideRaceOptions = game.system.id === "dnd5e" && this._settings.DnD5eRuleset === "2024";

        return {
            // Data passed to ConfigureActor form application
            final_results: this.final_results,
            bonus_points: this.bonus_points,
            individual_rolls: this.individual_rolls.map(x => x.result),
            Over18Allowed: this.Over18Allowed,
            DistributionMethod: this.DistributionMethod,
            hide_racial_bonus: hideRaceOptions,
            hide_race_options: hideRaceOptions,
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
    
    static async _submitActorData(data) {
        const owner = this.owner_id;
        const characterName = data.character_name ?? "";
        const selectedRace = data.select_race ?? "";
        let actor = await Actor.create({
            name: ((characterName === "New Actor" || characterName === "") && selectedRace !== "" ? selectedRace : characterName),
            permission: { [owner]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
            type: game_system_helper.getSystemActorType(),
            img: "icons/svg/mystery-man.svg"
        });
        
        // Use [game-system]-actor-helper class to update actor
        switch (game.system.id) {
            case "dnd5e":
                let dnd5e_actor_helper = new dnd5e_ActorHelper(actor);
                await dnd5e_actor_helper._Update(data);
                break;
            case "pf1":
                let pf1_actor_helper = new pf1_ActorHelper(actor);
                await pf1_actor_helper._Update(data);
                break;
            case "ose":
                let ose_actor_helper = new ose_ActorHelper(actor);
                await ose_actor_helper._Update(data);
                break;
            case "archmage":
                let archmage_actor_helper = new archmage_ActorHelper(actor);
                await archmage_actor_helper._Update(data);
                break;
            case "dcc":
                let dcc_actor_helper = new dcc_ActorHelper(actor);
                await dcc_actor_helper._Update(data);
                break;
            case "osric":
                let osric_actor_helper = new osric_ActorHelper(actor);
                await osric_actor_helper._Update(data);
                break;
            case "fantastic-depths":
                let fd_actor_helper = new fd_ActorHelper(actor);
                await fd_actor_helper._Update(data);
                break;
            default:
        }
    }

    static async _onSubmit(event, form, formData) {
        return ConfigureActor._submitActorData.call(this, formData.object);
    }

    async _onFormSubmit(event) {
        event.preventDefault();
        event.stopPropagation();

        const data = getFormObject(event.currentTarget);
        await ConfigureActor._submitActorData.call(this, data);
        this.close();
    }

    _onRender(context, options) {
        this._removeInlineEventHandlers();
        this._bindFormInteractions();
        this._initializeForm();
    }

    _removeInlineEventHandlers() {
        const inlineEventAttributes = ["onsubmit", "onchange", "onclick", "ondblclick", "ondrop", "ondragover"];
        const inlineEventSelector = inlineEventAttributes.map(attribute => `[${attribute}]`).join(",");
        this.element.querySelectorAll(inlineEventSelector).forEach(element => {
            inlineEventAttributes.forEach(attribute => element.removeAttribute(attribute));
        });
    }

    _bindFormInteractions() {
        const form = this.element.querySelector("form");
        form?.addEventListener("submit", (event) => {
            void this._onFormSubmit(event);
        });

        this._getElementById("character_name")?.addEventListener("change", () => {
            this._recalcFinalScores();
        });
        this._getElementById("select_race")?.addEventListener("change", (event) => {
            void this._updateRaceBonus(event);
        });
        this.element.querySelectorAll(".rncs-ability-drop-item, .rncs-ring-ability-drop-item").forEach(element => {
            this._bindMovableResultElement(element);
        });
        this.element.querySelectorAll(".rncs-variant-mod-drop-item").forEach(element => {
            this._bindDraggableElement(element);
        });
        this.element.querySelectorAll("#results_drop_zone, .rncs-ability-drop-zone, .rncs-racial-mod").forEach(dropZone => {
            this._bindDropZone(dropZone);
        });
        this._getElementById("rncs_ring_container_ability_total")?.addEventListener("dragover", (event) => {
            this._dragoverHandler(event);
        });
        this.element.querySelectorAll(".rncs-bp-button").forEach(button => {
            button.addEventListener("click", (event) => {
                this._bpChange(event);
            });
        });
        this._getElementById("individual_rolls_table")?.addEventListener("wheel", (event) => {
            this._onRingWheel(event);
        });
    }

    _bindMovableResultElement(element) {
        if (!element || element.dataset.rncsMoveBound) return;
        element.dataset.rncsMoveBound = "true";
        this._bindDraggableElement(element);
        element.addEventListener("dblclick", (event) => {
            void this._moveResult(event);
        });
    }

    _bindDraggableElement(element) {
        if (!element || element.dataset.rncsDragBound) return;
        element.dataset.rncsDragBound = "true";
        element.addEventListener("dragstart", (event) => {
            this._dragstartHandler(event);
        });
    }

    _bindDropZone(element) {
        if (!element || element.dataset.rncsDropBound) return;
        element.dataset.rncsDropBound = "true";
        element.addEventListener("drop", (event) => {
            this._dropHandler(event);
        });
        element.addEventListener("dragover", (event) => {
            this._dragoverHandler(event);
        });
    }

    _getElementById(id) {
        if (!id) return null;
        return Array.from(this.element?.querySelectorAll("[id]") ?? []).find(element => element.id === id) ?? document.getElementById(id);
    }

    _initializeForm() {
        const abilityScores = this._getElementById("ability_scores");
        if (!abilityScores) return;

        this._hideResultsZone(abilityScores.dataset.hideresultszone === "true");
        this._hideRingMethodZone(abilityScores.dataset.distributionmethod !== "ring-method");
        this._hideBonusPointColumn(abilityScores.dataset.bonus_points === "0" && abilityScores.dataset.distributionmethod !== "point-buy-method");

        if (abilityScores.dataset.distributionmethod === "apply-as-rolled" || abilityScores.dataset.distributionmethod === "point-buy-method") {
            this._applyAsRolled();
        }

        if (abilityScores.dataset.distributionmethod === "ring-method") {
            const individualRollsTable = this._getElementById("individual_rolls_table");
            this._individualRolls = individualRollsTable?.dataset.individualrolls?.split(",") ?? [];
            this._individualRollsRemaining = { rolls: [] };
            for (let rollIndex = 0; rollIndex < this._individualRolls.length; rollIndex += 1) {
                this._individualRollsRemaining.rolls.push({ value: this._individualRolls[rollIndex], index: rollIndex });
            }
            this._fillRingItemAdders();
            this._getSelectedRingTotal();
            this._highlightIndividualRolls(false);
        }

        const hideScoreColumn = abilityScores.dataset.bonus_points === "0" && abilityScores.dataset.distributionmethod === "apply-as-rolled";
        switch (game.system.id) {
            case "dnd5e":
            case "fantastic-depths":
                if (abilityScores.dataset.hideraceoptions === "true") {
                    this._hideRaceOptions();
                } else if (abilityScores.dataset.hideracebonuscolumn === "true") {
                    this._hideRaceBonusColumn();
                }
                break;
            case "pf1":
                this._hideScoreColumn(hideScoreColumn);
                break;
            case "ose":
                this._hideRaceOptions();
                this._hideScoreColumn(hideScoreColumn);
                break;
            case "archmage":
                this._hideRaceOptions();
                this._hideScoreColumn(hideScoreColumn);
                break;
            case "dcc":
                this._hideRaceOptions();
                this._hideScoreColumn(hideScoreColumn);
                {
                    const dccDescription = this._getElementById("dcc_description");
                    if (dccDescription) dccDescription.innerHTML = dccDescription.dataset.dcc_description ?? "";
                }
                break;
            case "osric":
                this._hideRaceOptions();
                this._hideScoreColumn(hideScoreColumn);
                this._hideAbilityModifierColumn();
                break;
            default:
                break;
        }
    }

    _hideResultsZone(hide) {
        if (hide) this._getElementById("results_table")?.classList.add("rncs-display-none");
    }

    _hideRingMethodZone(hide) {
        if (hide) this._getElementById("individual_rolls_table")?.classList.add("rncs-display-none");
    }

    _hideRaceOptions() {
        this._getElementById("race-selector")?.classList.add("rncs-display-none");
        this._hideColumn(".rncs-race-mod-header", ".rncs-racial-mod");
    }

    _hideRaceBonusColumn() {
        this._hideColumn(".rncs-race-mod-header", ".rncs-racial-mod");
    }

    _hideBonusPointColumn(hide) {
        if (hide) this._hideColumn(".rncs-bonus-header", ".rncs-bonus-points");
    }

    _hideScoreColumn(hide) {
        if (hide) this._hideColumn(".rncs-score-header", ".rncs-final-score");
    }

    _hideAbilityModifierColumn() {
        this._hideColumn(".rncs-modifier-header", ".rncs-modifier");
    }

    _hideColumn(tableHeaderClass, tableDataClass) {
        const abilityScores = this._getElementById("ability_scores");
        abilityScores?.querySelector(".rncs-header-row")?.querySelector(tableHeaderClass)?.classList.add("rncs-display-none");
        abilityScores?.querySelectorAll(".rncs-ability-row").forEach(abilityRow => {
            abilityRow.querySelector(tableDataClass)?.classList.add("rncs-display-none");
        });
    }

    _dragstartHandler(event) {
        const target = event.target;
        if (!target?.id) return;
        event.dataTransfer.setData("text/plain", target.id);
        event.dataTransfer.dropEffect = "copy";
    }

    _dragoverHandler(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
    }

    _dropHandler(event) {
        event.preventDefault();

        const data = event.dataTransfer.getData("text/plain");
        const dropItem = this._getElementById(data);
        const dropZone = event.target.closest("#results_drop_zone, .rncs-ability-drop-zone, .rncs-racial-mod, .rncs-ability-drop-item, .rncs-ring-ability-drop-item, .rncs-variant-mod-drop-item");
        if (!dropItem || !dropZone) return;

        const dropItemId = dropItem.id;
        const dropItemOriginalParent = dropItem.parentElement;

        if (dropItemId.includes("div_final_result") || dropItemId.includes("div_ring_final_result")) {
            if (dropZone.id === "results_drop_zone" || (dropZone.id.includes("ability_drop_zone") && !dropZone.querySelector(".rncs-ability-drop-item") && !dropZone.querySelector(".rncs-ring-ability-drop-item"))) {
                if (dropItem.parentElement.id === "rncs_ring_container_ability_total") {
                    this._updateRing(dropItem);
                }
                dropZone.appendChild(dropItem);
            } else if (dropZone.id.includes("div_final_result") || dropZone.id.includes("div_ring_final_result")) {
                const abilityItemDropZone = dropZone.parentElement;
                dropItemOriginalParent.appendChild(dropZone);
                abilityItemDropZone.appendChild(dropItem);
            }
        } else if (dropItemId.includes("div_variant_mod")) {
            if (dropZone.id.includes("racial_mod") && !dropZone.querySelector(".rncs-variant-mod-drop-item")) {
                dropZone.appendChild(dropItem);
            } else if (dropZone.id.includes("div_variant_mod")) {
                const variantItemDropZone = dropZone.parentElement;
                dropItemOriginalParent.appendChild(dropZone);
                variantItemDropZone.appendChild(dropItem);
            }
        }

        this._recalcFinalScores();
    }

    _bpChange(event) {
        const bpButton = event.target.closest(".rncs-bp-button");
        const bpPoints = bpButton?.parentElement?.querySelector(".rncs-bp");
        const spanBpMax = this._getElementById("span_bp_max");
        const spanBpRemaining = this._getElementById("span_bp_remaining");
        if (!bpButton || !bpPoints || !spanBpMax || !spanBpRemaining) return;

        const bpPointsValue = Number.parseInt(bpPoints.innerText) || 0;
        const bpMax = Number.parseInt(spanBpMax.innerText) || 0;
        let bpRemaining = Number.parseInt(spanBpRemaining.innerText) || 0;

        if (bpButton.id.includes("minus") && bpPointsValue > 0) {
            bpPoints.innerText = Math.max(0, bpPointsValue - 1);
            bpRemaining = bpRemaining < bpMax ? bpRemaining + 1 : bpMax;
            spanBpRemaining.innerText = bpRemaining;
        } else if (bpButton.id.includes("plus")) {
            bpPoints.innerText = bpRemaining > 0 ? bpPointsValue + 1 : bpPoints.innerText;
            bpRemaining = bpRemaining > 0 ? bpRemaining - 1 : 0;
            spanBpRemaining.innerText = bpRemaining;
        }

        this._recalcFinalScores();
    }

    _recalcFinalScores() {
        const abilityScores = this._getElementById("ability_scores");
        if (!abilityScores) return;

        let over18NotAllowed = abilityScores.dataset.over18allowed === "false" && (abilityScores.dataset.distributionmethod !== "apply-as-rolled" || Number.parseInt(abilityScores.dataset.bonus_points) > 0);
        let scoreOver18 = false;

        abilityScores.querySelectorAll(".rncs-ability-row").forEach(abilityRow => {
            let abilityDropItem = abilityRow.querySelector(".rncs-ability-drop-zone")?.querySelector(".rncs-ability-drop-item");
            if (!abilityDropItem) {
                abilityDropItem = abilityRow.querySelector(".rncs-ability-drop-zone")?.querySelector(".rncs-ring-ability-drop-item");
            }

            const bonusPoints = abilityRow.querySelector(".rncs-bonus-points")?.querySelector(".rncs-bp");
            const racialMod = abilityRow.querySelector(".rncs-racial-mod");
            const finalScoreUnmod = abilityRow.querySelector(".rncs-final-score-unmod");
            const finalScoreDisplay = abilityRow.querySelector(".rncs-final-score-display");
            const modifier = abilityRow.querySelector(".rncs-modifier");
            const abilityText = abilityRow.querySelector(".rncs-ability-text")?.innerText.toLowerCase();
            if (!bonusPoints || !racialMod || !finalScoreUnmod || !finalScoreDisplay || !modifier || !abilityText) return;

            const finalResult = Number.parseInt(abilityDropItem ? abilityDropItem.innerText : "0") || 0;
            const bonusResult = Number.parseInt(bonusPoints.innerText) || 0;
            const racialModResult = Number.parseInt(racialMod.innerText.length > 0 ? racialMod.innerText : "0") || 0;
            finalScoreUnmod.value = finalResult + bonusResult;
            finalScoreDisplay.value = finalResult + bonusResult + racialModResult;

            let abilityMod = 0;
            switch (game.system.id) {
                case "dnd5e":
                case "pf1":
                case "archmage":
                case "ose":
                case "fantastic-depths":
                case "osric":
                    abilityMod = Math.floor((finalScoreDisplay.value - 10) / 2);
                    break;
                case "dcc":
                    abilityMod = CONFIG.DCC.abilityModifiers[finalScoreDisplay.value];
                    break;
                default:
                    abilityMod = Math.floor((finalScoreDisplay.value - 10) / 2);
            }
            modifier.value = (abilityMod > 0 ? "+" : "") + abilityMod;

            const hpModifierAbility = this._getElementById("hp_modifier_ability");
            const hpModifier = this._getElementById("hp_modifier");
            if (hpModifierAbility?.value === abilityText && hpModifier) hpModifier.value = modifier.value;

            scoreOver18 = finalScoreDisplay.value > 18 ? true : scoreOver18;
            over18NotAllowed = scoreOver18 && over18NotAllowed ? true : over18NotAllowed;
            if (finalScoreDisplay.value > 18 && over18NotAllowed) {
                finalScoreDisplay.classList.add("rncs-over18");
            } else {
                finalScoreDisplay.classList.remove("rncs-over18");
            }
        });

        const characterName = this._getElementById("character_name");
        const bpRemaining = Number.parseInt(this._getElementById("span_bp_remaining")?.innerText) || 0;
        const submitButton = this._getElementById("configure_actor_submit");
        if (submitButton) {
            submitButton.disabled = (characterName?.value.length === 0 || this._getNextEmptyDropZone(".rncs-ability-drop-zone") || bpRemaining > 0 || (scoreOver18 && over18NotAllowed));
        }
    }

    async _moveResult(event) {
        const resultItem = this._getElementById(event.target.id);
        const resultsDropZone = this._getElementById("results_drop_zone");
        if (!resultItem || resultItem.dataset.rncsLocked || !resultsDropZone || resultItem.innerText === "") return;

        if (resultItem.parentElement.id === "results_drop_zone" || resultItem.parentElement.id === "rncs_ring_container_ability_total") {
            const nextAbility = this._getNextEmptyDropZone(".rncs-ability-drop-zone");
            if (nextAbility && resultItem.parentElement.id === "rncs_ring_container_ability_total") {
                this._updateRing(resultItem);
            }
            if (nextAbility) {
                nextAbility.appendChild(resultItem);
            }
        } else if (!resultItem.id.includes("div_ring_final_result")) {
            resultsDropZone.appendChild(resultItem);
        }

        this._recalcFinalScores();
    }

    _getNextEmptyDropZone(dropZoneClass) {
        const abilityScores = this._getElementById("ability_scores");
        const abilityRows = abilityScores?.querySelectorAll(".rncs-ability-row") ?? [];
        for (const abilityRow of abilityRows) {
            const targetDropZone = abilityRow.querySelector(dropZoneClass);
            if (targetDropZone?.innerText === "") return targetDropZone;
        }
        return false;
    }

    _applyAsRolled() {
        const resultsDropZone = this._getElementById("results_drop_zone");
        if (!resultsDropZone) return;

        const abilityDropItems = Array.from(resultsDropZone.querySelectorAll(".rncs-ability-drop-item"));
        abilityDropItems.forEach(abilityDropItem => {
            const nextAbility = this._getNextEmptyDropZone(".rncs-ability-drop-zone");
            if (nextAbility) {
                abilityDropItem.dataset.rncsLocked = "true";
                abilityDropItem.removeAttribute("draggable");
                nextAbility.appendChild(abilityDropItem);
            }
        });
        resultsDropZone.innerHTML = "<small><em>" + game.i18n.localize("RNCS.form-app.form-text.applied-as-rolled") + "</em></small>";
        this._recalcFinalScores();
    }

    async _updateRaceBonus(event) {
        const abilityScores = this._getElementById("ability_scores");
        if (!abilityScores) return;

        if (abilityScores.dataset.hideracebonuscolumn === "true") {
            this._recalcFinalScores();
            return;
        }

        const select = this._getElementById(event.target.id);
        const jsonDATA = await this._getJSONData("./modules/roll-new-character-stats/data/character-properties.json");
        let raceBonuses;
        switch (game.system.id) {
            case "dnd5e":
                raceBonuses = jsonDATA.game_system[0].dnd5e.races[select.selectedIndex];
                break;
            case "pf1":
                raceBonuses = jsonDATA.game_system[0].pf1.races[select.selectedIndex];
                break;
            default:
                raceBonuses = jsonDATA.game_system[0].dnd5e.races[select.selectedIndex];
        }

        abilityScores.querySelectorAll(".rncs-ability-row").forEach((abilityRow, rowIndex) => {
            const racialMod = abilityRow.querySelector(".rncs-racial-mod");
            if (!racialMod) return;

            if (raceBonuses.asi_any.length === 0) {
                const abilityText = abilityRow.querySelector(".rncs-ability-text").innerText.toLowerCase();
                racialMod.innerText = raceBonuses[abilityText];
            } else {
                racialMod.innerText = "";

                const variantMod = document.createElement("div");
                variantMod.id = "div_variant_mod_" + Math.random().toString(36).slice(2);
                variantMod.setAttribute("draggable", "true");
                variantMod.classList.add("rncs-variant-mod-drop-item");
                this._bindDraggableElement(variantMod);
                if (raceBonuses.asi_any[rowIndex]) {
                    variantMod.innerText = raceBonuses.asi_any[rowIndex];
                    racialMod.appendChild(variantMod);
                }
            }
        });

        this._recalcFinalScores();
    }

    async _getJSONData(filename) {
        return fetch(filename)
            .then(response => response.json())
            .then(data => data);
    }

    _fillRingItemAdders() {
        this.element.querySelectorAll(".rncs-ring-item-adder").forEach(ringItemAdder => {
            ringItemAdder.innerText = "";
        });

        if (!this._individualRollsRemaining?.rolls.length) return;

        let adderPosition = 0;
        this.element.querySelectorAll(".rncs-ring-item-adder").forEach(ringItemAdder => {
            const individualRollValue = this._individualRollsRemaining.rolls[(this._ringStart + adderPosition) % this._individualRollsRemaining.rolls.length]?.value;
            ringItemAdder.innerText = individualRollValue ?? "";
            adderPosition += 1;
        });
    }

    _getSelectedRingTotal() {
        let total = 0;
        this.element.querySelectorAll(".rncs-ring-item-adder").forEach(ringItemAdder => {
            total += Number.parseInt(ringItemAdder.innerText) || 0;
        });

        const ringItemTotal = this._getElementById("div_ring_final_result");
        if (!ringItemTotal) return;

        ringItemTotal.innerText = total > 0 ? total : "";
        if (total > 0 && this._getNextEmptyDropZone(".rncs-ability-drop-zone")) {
            ringItemTotal.setAttribute("draggable", "true");
            this._bindMovableResultElement(ringItemTotal);
        } else {
            ringItemTotal.removeAttribute("draggable");
        }
    }

    _updateRing(resultItem) {
        if (!this._individualRollsRemaining?.rolls.length) return;

        const ringContainer = this._getElementById(resultItem.parentElement.id);
        const resultItemNew = resultItem.cloneNode(false);
        delete resultItemNew.dataset.rncsDragBound;
        delete resultItemNew.dataset.rncsMoveBound;
        ringContainer.appendChild(resultItemNew);
        this._bindMovableResultElement(resultItemNew);

        resultItem.id += "-" + Math.random().toString(36).slice(2);

        const remainingRolls = this._individualRollsRemaining.rolls;
        if (remainingRolls.length - this._ringStart >= 3) {
            remainingRolls.splice(this._ringStart, 3);
            this._ringStart = remainingRolls.length ? this._ringStart % remainingRolls.length : 0;
        } else {
            const diff = remainingRolls.length - this._ringStart;
            remainingRolls.splice(this._ringStart, diff);
            remainingRolls.splice(0, 3 - diff);
            this._ringStart = 0;
        }

        this._fillRingItemAdders();
        this._getSelectedRingTotal();
        this._highlightIndividualRolls(true);
    }

    _onRingWheel(event) {
        if (!this._individualRollsRemaining?.rolls.length) return;

        const ringReverse = game.settings.get("roll-new-character-stats", "ReverseRingMethodScrolling");
        const remainingRollCount = this._individualRollsRemaining.rolls.length;
        if (event.deltaY > 0) {
            if (!ringReverse) {
                this._ringStart = (this._ringStart + 1 === remainingRollCount ? 0 : this._ringStart + 1) % remainingRollCount;
            } else {
                this._ringStart = (this._ringStart - 1 === -1 ? remainingRollCount - 1 : this._ringStart - 1) % remainingRollCount;
            }
        } else if (!ringReverse) {
            this._ringStart = (this._ringStart - 1 === -1 ? remainingRollCount - 1 : this._ringStart - 1) % remainingRollCount;
        } else {
            this._ringStart = (this._ringStart + 1 === remainingRollCount ? 0 : this._ringStart + 1) % remainingRollCount;
        }

        this._fillRingItemAdders();
        this._getSelectedRingTotal();
        this._highlightIndividualRolls(false);
    }

    _highlightIndividualRolls(highlightUsed) {
        if (!this._individualRollsRemaining?.rolls.length) return;

        this.element.querySelectorAll(".rncs-individual-roll").forEach(individualRollItem => {
            if (highlightUsed && individualRollItem.classList.contains("rncs-ring-selection")) {
                individualRollItem.classList.add("rncs-individual-roll-used");
            }
            individualRollItem.classList.remove("rncs-ring-selection");
        });

        for (let rollOffset = 0; rollOffset < 3; rollOffset += 1) {
            const selectedIndex = (this._ringStart + rollOffset === this._individualRollsRemaining.rolls.length ? 0 : this._ringStart + rollOffset) % this._individualRollsRemaining.rolls.length;
            const selectedRoll = this._individualRollsRemaining.rolls[selectedIndex];
            const individualRollItem = this._getElementById("rncs_individual_rolls" + selectedRoll?.index);
            individualRollItem?.classList.add("rncs-ring-selection");
        }
    }
}

window.ConfigureActor = ConfigureActor;