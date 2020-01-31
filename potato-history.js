#!/usr/bin/env node
const _ = require("lodash");
const fs = require("fs");
const inquirer = require("inquirer");
const { Search } = require("potato-search");
const chalk = require("chalk");

inquirer.registerPrompt("autocomplete", require("inquirer-autocomplete-prompt"));

const lines = _.reverse(_.split(fs.readFileSync("/Users/nitsanavni/.zsh_history", "utf-8"), "\n"));

const potatoSearch = new Search({ markBefore: "", markAfter: "" });
const highlight = chalk.bold.underline.yellow;

(async function() {
    const { hist } = await inquirer.prompt({
        type: "autocomplete",
        name: "hist",
        message: "",
        choices: lines,
        suggestOnly: false,
        source: (x, input) => {
            potatoSearch.term(input || "");

            return new Promise((resolve, x) =>
                resolve(
                    // TODO - this should be part of potato-search
                    _.chain(lines)
                        .map((scenario) => potatoSearch.in(scenario))
                        .filter((potato) => potato.score > 0)
                        .sortBy((potato) => -potato.score)
                        .map((potato) => ({
                            name: _.reduce(
                                potato.spans,
                                (prev, curr, i, spans) =>
                                    prev +
                                    highlight(potato.marked.slice(curr[0], curr[1])) +
                                    potato.marked.slice(curr[1], spans[i + 1] && spans[i + 1][0]),
                                potato.marked.slice(0, _.get(potato.spans, "[0][0]"))
                            ),
                            value: potato.marked
                        }))
                        .value()
                )
            );
        }
    });

    fs.writeFileSync("/tmp/hist", hist);
})();
