import { RNCS } from "./main.js";
export const settingsKey = "roll-new-character-stats";

// All supported distribution method keys, in display order
export const ALL_DISTRIBUTION_METHODS = ["apply-as-rolled", "distribute-freely", "ring-method", "point-buy-method"];

// ***********************************************************************************************
//
// MAKE SURE YOU ADD NEW SETTINGS TO ./registered-settings.js 
//
// ***********************************************************************************************

export function registerSettings() {

    game.settings.register(settingsKey, "ForceDefaultSettings", {
        scope: "world",
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register(RNCS.ID, "version", {
        scope: "world",
        config: false,
        default: "0.0.0",
        type: String,
        onChange: () => {
            if (!game.user.isGM || game.settings.get(RNCS.ID, "ForceDefaultSettings") === false) return;
            foundry.applications.api.DialogV2.prompt({
                window: { title: `RNCS | ${game.i18n.localize("RNCS.settings.version.title")}` },
                content: game.i18n.localize("RNCS.settings.version.content"),
                ok: {
                    label: game.i18n.localize("OK"),
                    callback: () => { RNCS.restoreDefaultSettings(); }
                },
                rejectClose: false
            });
        },
    });

    game.settings.registerMenu(settingsKey, "ChatSettings", {
        name: "",
        hint: game.i18n.localize("RNCS.settings.ChatSettings.Hint"),
        label: game.i18n.localize("RNCS.settings.ChatSettings.Name"),
        icon: "fas fa-comments",
        type: ChatSettings,
        restricted: true,
    })

    game.settings.registerMenu(settingsKey, "RollMethodAndDistribution", {
        name: "",
        hint: game.i18n.localize("RNCS.settings.RollMethodAndDistribution.Hint"),
        label: game.i18n.localize("RNCS.settings.RollMethodAndDistribution.Name"),
        icon: "fas fa-dice",
        type: RollAndDistributionMethodSettings,
        restricted: true,
    })

    game.settings.register(settingsKey, "NumberOfActors", {
        name: game.i18n.localize("RNCS.settings.NumberOfActors.Name"),
        hint: game.i18n.localize("RNCS.settings.NumberOfActors.Hint"),
        scope: "client",
        config: true,
        type: Number,
        default: 1
    });

    game.settings.register(settingsKey, "DiceSoNiceEnabled", {
        name: game.i18n.localize("RNCS.settings.DiceSoNiceEnabled.Name"),
        hint: game.i18n.localize("RNCS.settings.DiceSoNiceEnabled.Hint"),
        scope: "client",
        config: true,
        type: Boolean,
        default: true
    });

    // BEGIN Config Actor Settings
    game.settings.register(settingsKey, "NameFormat", {
        name: game.i18n.localize("RNCS.settings.NameFormat.Name"),
        hint: game.i18n.localize("RNCS.settings.NameFormat.Hint"),
        scope: "world",
        config: game.system.id === "dcc",
        type: String,
        choices: {
            "player-occupation": game.i18n.localize("RNCS.settings.NameFormat.choices.player-occupation"),
            "occupation-player": game.i18n.localize("RNCS.settings.NameFormat.choices.occupation-player"),
            "occupation": game.i18n.localize("RNCS.settings.NameFormat.choices.occupation"),
            "random": game.i18n.localize("RNCS.settings.NameFormat.choices.random")
        },
        default: "player-occupation"
    });

    game.settings.register(settingsKey, "HideResultsZone", {
        name: game.i18n.localize("RNCS.settings.HideResultsZone.Name"),
        hint: game.i18n.localize("RNCS.settings.HideResultsZone.Hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register(settingsKey, "ReverseRingMethodScrolling", {
        name: game.i18n.localize("RNCS.settings.ReverseRingMethodScrolling.Name"),
        hint: game.i18n.localize("RNCS.settings.ReverseRingMethodScrolling.Hint"),
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register(settingsKey, "DnD5eRuleset", {
        name: game.i18n.localize("RNCS.settings.DnD5eRuleset.Name"),
        hint: game.i18n.localize("RNCS.settings.DnD5eRuleset.Hint"),
        scope: "world",
        config: game.system.id === "dnd5e",
        type: String,
        choices: {
            "2014": game.i18n.localize("RNCS.settings.DnD5eRuleset.choices.2014"),
            "2024": game.i18n.localize("RNCS.settings.DnD5eRuleset.choices.2024")
        },
        default: "2014"
    });

    game.settings.register(settingsKey, "ShowOtherPropertyResults", {
        name: game.i18n.localize("RNCS.settings.ShowOtherPropertyResults.Name"),
        hint: game.i18n.localize("RNCS.settings.ShowOtherPropertyResults.Hint"),
        scope: "world",
        config: game.system.id === "dcc",
        type: String,
        choices: {
            "do-not-show": game.i18n.localize("RNCS.settings.ShowOtherPropertyResults.choices.do-not-show"),
            "with-result": game.i18n.localize("RNCS.settings.ShowOtherPropertyResults.choices.with-result"),
            "in-place-of": game.i18n.localize("RNCS.settings.ShowOtherPropertyResults.choices.in-place-of")
        },
        default: "do-not-show"
    });

    game.settings.register(settingsKey, "IncludeResultDescription", {
        name: game.i18n.localize("RNCS.settings.IncludeResultDescription.Name"),
        hint: game.i18n.localize("RNCS.settings.IncludeResultDescription.Hint"),
        scope: "client",
        config: game.system.id === "dcc",
        type: Boolean,
        default: true
    });
    // END Config Actor Settings

    // BEGIN Chat Settings 
    game.settings.register(settingsKey, "ChatRemoveConfigureActorButton", {
        name: game.i18n.localize("RNCS.settings.ChatRemoveConfigureActorButton.Name"),
        hint: game.i18n.localize("RNCS.settings.ChatRemoveConfigureActorButton.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register(settingsKey, "ChatShowDescription", {
        name: game.i18n.localize("RNCS.settings.ChatShowDescription.Name"),
        hint: game.i18n.localize("RNCS.settings.ChatShowDescription.Hint"),
        scope: "world",
        config: false,//game.system.id === "dcc",
        type: Boolean,
        default: true
    });

    game.settings.register(settingsKey, "ChatShowMethodText", {
        name: game.i18n.localize("RNCS.settings.ChatShowMethodText.Name"),
        hint: game.i18n.localize("RNCS.settings.ChatShowMethodText.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register(settingsKey, "ChatShowResultsText", {
        name: game.i18n.localize("RNCS.settings.ChatShowResultsText.Name"),
        hint: game.i18n.localize("RNCS.settings.ChatShowResultsText.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register(settingsKey, "ChatShowCondensedResults", {
        name: game.i18n.localize("RNCS.settings.ChatShowCondensedResults.Name"),
        hint: game.i18n.localize("RNCS.settings.ChatShowCondensedResults.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register(settingsKey, "ChatShowTotalAbilityScore", {
        name: game.i18n.localize("RNCS.settings.ChatShowTotalAbilityScore.Name"),
        hint: game.i18n.localize("RNCS.settings.ChatShowTotalAbilityScore.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register(settingsKey, "ChatShowDieResultSet", {
        name: game.i18n.localize("RNCS.settings.ChatShowDieResultSet.Name"),
        hint: game.i18n.localize("RNCS.settings.ChatShowDieResultSet.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register(settingsKey, "ChatShowBonusPointsText", {
        name: game.i18n.localize("RNCS.settings.ChatShowBonusPointsText.Name"),
        hint: game.i18n.localize("RNCS.settings.ChatShowBonusPointsText.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register(settingsKey, "ChatShowDifficultyText", {
        name: game.i18n.localize("RNCS.settings.ChatShowDifficultyText.Name"),
        hint: game.i18n.localize("RNCS.settings.ChatShowDifficultyText.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register(settingsKey, "ChatShowNoteFromDM", {
        name: game.i18n.localize("RNCS.settings.ChatShowNoteFromDM.Name"),
        hint: game.i18n.localize("RNCS.settings.ChatShowNoteFromDM.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: true
    });
    // END Chat Settings 

    // BEGIN Roll & Distribution Method Settings
    game.settings.register(settingsKey, "AbilitiesRollMethod", {
        name: game.i18n.localize("RNCS.settings.AbilitiesRollMethod.Name"),
        hint: game.i18n.localize("RNCS.settings.AbilitiesRollMethod.Hint"),
        scope: "world",
        config: false,
        type: Number,
        choices: {
            "3": game.i18n.localize("RNCS.settings.AbilitiesRollMethod.choices.3"),
            "4": game.i18n.localize("RNCS.settings.AbilitiesRollMethod.choices.4"),
            "2": game.i18n.localize("RNCS.settings.AbilitiesRollMethod.choices.2")
        },
        default: 3
    });

    game.settings.register(settingsKey, "DropLowestDieRoll", {
        name: game.i18n.localize("RNCS.settings.DropLowestDieRoll.Name"),
        hint: game.i18n.localize("RNCS.settings.DropLowestDieRoll.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register(settingsKey, "ReRollOnes", {
        name: game.i18n.localize("RNCS.settings.ReRollOnes.Name"),
        hint: game.i18n.localize("RNCS.settings.ReRollOnes.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register(settingsKey, "NumberOfSetsRolled", {
        name: game.i18n.localize("RNCS.settings.NumberOfSetsRolled.Name"),
        hint: game.i18n.localize("RNCS.settings.NumberOfSetsRolled.Hint"),
        scope: "world",
        config: false,
        type: Number,
        choices: {
            "6": game.i18n.localize("RNCS.settings.NumberOfSetsRolled.choices.6"),
            "7": game.i18n.localize("RNCS.settings.NumberOfSetsRolled.choices.7"),
            "8": game.i18n.localize("RNCS.settings.NumberOfSetsRolled.choices.8"),
            "9": game.i18n.localize("RNCS.settings.NumberOfSetsRolled.choices.9")
        },
        default: 6
    });

    game.settings.register(settingsKey, "DropLowestSet", {
        name: game.i18n.localize("RNCS.settings.DropLowestSet.Name"),
        hint: game.i18n.localize("RNCS.settings.DropLowestSet.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register(settingsKey, "BonusPoints", {
        name: game.i18n.localize("RNCS.settings.BonusPoints.Name"),
        hint: game.i18n.localize("RNCS.settings.BonusPoints.Hint"),
        scope: "world",
        config: false,
        type: String,
        choices: {
            "zero-points": game.i18n.localize("RNCS.settings.BonusPoints.choices.zero-points"),
            "one-point": game.i18n.localize("RNCS.settings.BonusPoints.choices.one-point"),
            "one-d-four": game.i18n.localize("RNCS.settings.BonusPoints.choices.one-d-four")
        },
        default: "zero-points"
    });

    game.settings.register(settingsKey, "Over18Allowed", {
        name: game.i18n.localize("RNCS.settings.Over18Allowed.Name"),
        hint: game.i18n.localize("RNCS.settings.Over18Allowed.Hint"),
        scope: "world",
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register(settingsKey, "MinimumAbilityTotal", {
        name: game.i18n.localize("RNCS.settings.MinimumAbilityTotal.Name"),
        hint: game.i18n.localize("RNCS.settings.MinimumAbilityTotal.Hint"),
        scope: "world",
        config: false,
        type: Number,
        default: 0,
        restricted: true,
    });

    game.settings.register(settingsKey, "MaximumAbilityTotal", {
        name: game.i18n.localize("RNCS.settings.MaximumAbilityTotal.Name"),
        hint: game.i18n.localize("RNCS.settings.MaximumAbilityTotal.Hint"),
        scope: "world",
        config: false,
        type: Number,
        default: 0,
        restricted: true,
    });

    game.settings.register(settingsKey, "AllowedDistributionMethods", {
        name: game.i18n.localize("RNCS.settings.AllowedDistributionMethods.Name"),
        hint: game.i18n.localize("RNCS.settings.AllowedDistributionMethods.Hint"),
        scope: "world",
        config: false,
        type: String,
        default: JSON.stringify(ALL_DISTRIBUTION_METHODS)
    });

    game.settings.register(settingsKey, "DistributionMethod", {
        name: game.i18n.localize("RNCS.settings.DistributionMethod.Name"),
        hint: game.i18n.localize("RNCS.settings.DistributionMethod.Hint"),
        scope: "client",
        config: false,
        type: String,
        choices: {
            "apply-as-rolled": game.i18n.localize("RNCS.settings.DistributionMethod.choices.apply-as-rolled"),
            "distribute-freely": game.i18n.localize("RNCS.settings.DistributionMethod.choices.distribute-freely"),
            "ring-method": game.i18n.localize("RNCS.settings.DistributionMethod.choices.ring-method"),
            "point-buy-method": game.i18n.localize("RNCS.settings.DistributionMethod.choices.point-buy-method")
        },
        default: "apply-as-rolled"
    });
    // END Roll & Distribution Method Settings

    // game.settings.register(settingsKey, "SettingName", {
    //     name: game.i18n.localize("RNCS.settings.SettingName.Name"),
    //     hint: game.i18n.localize("RNCS.settings.SettingName.Hint"),
    //     scope: "world",
    //     config: true,
    //     type: Boolean,
    //     default: false
    // });

    // game.settings.register(settingsKey, "SettingName", {
    //     name: game.i18n.localize("RNCS.settings.SettingName.Name"),
    //     hint: game.i18n.localize("RNCS.settings.SettingName.Hint"),
    //     scope: "world",
    //     config: true,
    //     type: String,
    //     choices: {
    //         "0": game.i18n.localize("RNCS.settings.SettingName.choices.0"),
    //         "1": game.i18n.localize("RNCS.settings.SettingName.choices.1"),
    //         "2": game.i18n.localize("RNCS.settings.SettingName.choices.2")
    //     },
    //     default: "0"
    // });

    console.log(RNCS.ID + " | Registered Settings");
}

Hooks.on('renderChatSettings', () => {
    Intitialize();
});

class ChatSettings extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

    static DEFAULT_OPTIONS = {
        id: "rncs-chat-settings",
        window: { title: "RNCS - Edit Chat Settings" },
        form: { handler: ChatSettings._onSubmit, closeOnSubmit: true },
        position: { width: 500, height: "auto" }
    };

    static PARTS = {
        form: { template: "./modules/roll-new-character-stats/templates/form-apps/edit-chat-settings.hbs" }
    };

    async _prepareContext(options) {
        return {
            ChatRemoveConfigureActorButton_value: game.settings.get(settingsKey, "ChatRemoveConfigureActorButton"),
            ChatShowDescription_value: game.settings.get(settingsKey, "ChatShowDescription"),
            ChatShowMethodText_value: game.settings.get(settingsKey, "ChatShowMethodText"),
            ChatShowResultsText_value: game.settings.get(settingsKey, "ChatShowResultsText"),
            ChatShowTotalAbilityScore_value: game.settings.get(settingsKey, "ChatShowTotalAbilityScore"),
            ChatShowCondensedResults_value: game.settings.get(settingsKey, "ChatShowCondensedResults"),
            ChatShowDieResultSet_value: game.settings.get(settingsKey, "ChatShowDieResultSet"),
            ChatShowBonusPointsText_value: game.settings.get(settingsKey, "ChatShowBonusPointsText"),
            ChatShowDifficultyText_value: game.settings.get(settingsKey, "ChatShowDifficultyText"),
            ChatShowNoteFromDM_value: game.settings.get(settingsKey, "ChatShowNoteFromDM")
        }
    }

    static async _onSubmit(event, form, formData) {
        if (event.submitter?.id !== "cancel") {
            const data = formData.object;
            game.settings.set(settingsKey, "ChatRemoveConfigureActorButton", data.rncs_ChatRemoveConfigureActorButton),
            game.settings.set(settingsKey, "ChatShowDescription", data.rncs_ChatShowDescription),
            game.settings.set(settingsKey, "ChatShowMethodText", data.rncs_ChatShowMethodText),
            game.settings.set(settingsKey, "ChatShowResultsText", data.rncs_ChatShowResultsText),
            game.settings.set(settingsKey, "ChatShowTotalAbilityScore", data.rncs_ChatShowTotalAbilityScore),
            game.settings.set(settingsKey, "ChatShowCondensedResults", data.rncs_ChatShowCondensedResults),
            game.settings.set(settingsKey, "ChatShowDieResultSet", data.rncs_ChatShowDieResultSet),
            game.settings.set(settingsKey, "ChatShowBonusPointsText", data.rncs_ChatShowBonusPointsText),
            game.settings.set(settingsKey, "ChatShowDifficultyText", data.rncs_ChatShowDifficultyText),
            game.settings.set(settingsKey, "ChatShowNoteFromDM", data.rncs_ChatShowNoteFromDM)
        }
    }

    _onRender(context, options) {
        this.element.querySelectorAll(".rncs-form-group").forEach(group => {
            group.addEventListener("click", (event) => {
                // Skip if clicking the text input or its label
                if (event.target.closest("#rncs_NoteFromDM, label[for='rncs_NoteFromDM']")) {
                    return;
                }
                const checkbox = event.currentTarget.querySelector("input[type='checkbox']");
                if (checkbox && !event.target.matches("input[type='checkbox']")) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
                }
            });
        });
    }
}

class RollAndDistributionMethodSettings extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

    AbilitiesRollMethod_choices = {// choices.# represents number of d6
        "3": game.i18n.localize("RNCS.settings.AbilitiesRollMethod.choices.3"),
        "4": game.i18n.localize("RNCS.settings.AbilitiesRollMethod.choices.4"),
        "2": game.i18n.localize("RNCS.settings.AbilitiesRollMethod.choices.2")
    }

    NumberOfSetsRolled_choices = {
        "6": game.i18n.localize("RNCS.settings.NumberOfSetsRolled.choices.6"),
        "7": game.i18n.localize("RNCS.settings.NumberOfSetsRolled.choices.7"),
        "8": game.i18n.localize("RNCS.settings.NumberOfSetsRolled.choices.8"),
        "9": game.i18n.localize("RNCS.settings.NumberOfSetsRolled.choices.9")
    }

    BonusPoints_choices = {
        "zero-points": game.i18n.localize("RNCS.settings.BonusPoints.choices.zero-points"),
        "one-point": game.i18n.localize("RNCS.settings.BonusPoints.choices.one-point"),
        "one-d-four": game.i18n.localize("RNCS.settings.BonusPoints.choices.one-d-four")
    }

    DistributionMethod_choices = {
        "apply-as-rolled": game.i18n.localize("RNCS.settings.DistributionMethod.choices.apply-as-rolled"),
        "distribute-freely": game.i18n.localize("RNCS.settings.DistributionMethod.choices.distribute-freely"),
        "ring-method": game.i18n.localize("RNCS.settings.DistributionMethod.choices.ring-method"),
        "point-buy-method": game.i18n.localize("RNCS.settings.DistributionMethod.choices.point-buy-method")
    }

    static DEFAULT_OPTIONS = {
        id: "rncs-roll-dist-method",
        window: { title: "RNCS - Roll Method & Distribution" },
        form: { handler: RollAndDistributionMethodSettings._onSubmit, closeOnSubmit: true },
        position: { width: 500 }
    };

    static PARTS = {
        form: { template: "./modules/roll-new-character-stats/templates/form-apps/edit-roll-dist-method.hbs" }
    };

    async _prepareContext(options) {
        const allowedRaw = game.settings.get(settingsKey, "AllowedDistributionMethods");
        let allowedMethods = [];
        try { allowedMethods = JSON.parse(allowedRaw); } catch(e) { allowedMethods = []; }

        // Build checklist state for each method
        const DistributionMethod_checklist = Object.entries(this.DistributionMethod_choices).map(([key, label]) => ({
            key,
            label,
            checked: allowedMethods.includes(key),
            description: game.i18n.localize("RNCS.results-text.note-from-dm." + key)
        }));

        return {
            AbilitiesRollMethod_choices: this.AbilitiesRollMethod_choices,
            AbilitiesRollMethod_value: game.settings.get(settingsKey, "AbilitiesRollMethod"),
            DropLowestDieRoll_value: game.settings.get(settingsKey, "DropLowestDieRoll"),
            ReRollOnes_value: game.settings.get(settingsKey, "ReRollOnes"),
            NumberOfSetsRolled_choices: this.NumberOfSetsRolled_choices,
            NumberOfSetsRolled_value: game.settings.get(settingsKey, "NumberOfSetsRolled"),
            DropLowestSet_value: game.settings.get(settingsKey, "DropLowestSet"),
            BonusPoints_choices: this.BonusPoints_choices,
            BonusPoints_value: game.settings.get(settingsKey, "BonusPoints"),
            Over18Allowed_value: game.settings.get(settingsKey, "Over18Allowed"),
            MinimumAbilityTotal_value: game.settings.get(settingsKey, "MinimumAbilityTotal"),
            MaximumAbilityTotal_value: game.settings.get(settingsKey, "MaximumAbilityTotal"),
            DistributionMethod_checklist: DistributionMethod_checklist
        }
    }

    static async _onSubmit(event, form, formData) {
        if (event.submitter?.id !== "cancel") {
            const data = formData.object;

            // Collect allowed distribution methods from checkboxes
            const allowedMethods = ALL_DISTRIBUTION_METHODS.filter(m => data["rncs_AllowedMethod_" + m] === true);
            // Ensure at least one method is allowed
            const methodsToSave = allowedMethods.length > 0 ? allowedMethods : ["apply-as-rolled"];

            game.settings.set(settingsKey, "AbilitiesRollMethod", data.rncs_AbilitiesRollMethod),
            game.settings.set(settingsKey, "DropLowestDieRoll", data.rncs_DropLowestDieRoll),
            game.settings.set(settingsKey, "ReRollOnes", data.rncs_ReRollOnes),
            game.settings.set(settingsKey, "NumberOfSetsRolled", data.rncs_NumberOfSetsRolled),
            game.settings.set(settingsKey, "DropLowestSet", data.rncs_DropLowestSet),
            game.settings.set(settingsKey, "BonusPoints", data.rncs_BonusPoints),
            game.settings.set(settingsKey, "Over18Allowed", data.rncs_Over18Allowed),
            game.settings.set(settingsKey, "MinimumAbilityTotal", data.rncs_MinimumAbilityTotal),
            game.settings.set(settingsKey, "MaximumAbilityTotal", data.rncs_MaximumAbilityTotal),
            game.settings.set(settingsKey, "AllowedDistributionMethods", JSON.stringify(methodsToSave))
        }
    }

    _onRender(context, options) {
        this.element.querySelectorAll(".rncs-form-group").forEach(group => {
            group.addEventListener("click", (event) => {
                // Skip if clicking the text input or its label
                if (event.target.closest("#rncs_DistributionMethod, label[for='rncs_DistributionMethod']")) {
                    return;
                }
                const checkbox = event.currentTarget.querySelector("input[type='checkbox']");
                if (checkbox && !event.target.matches("input[type='checkbox']")) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
                }
            });
        });
    }
}