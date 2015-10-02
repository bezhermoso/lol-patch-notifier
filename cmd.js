#!/usr/bin/env node

var versions = require('./lib/versions');
var command = require('commander');
var R = require('ramda');
var request = require('request');
var Promise = require("bluebird");

command.option('-s, --since <v>', 'Patch number (i.e. 5.19)');
command.option('-f, --frequency <minutes>', 'Check & notification frequency');

/** 
 * Checks for any patches since `since` and pass it unto the notifier.
 *
 * Returns a function that when executed, will start another notify cycle which
 * checks for patches since the latest patch.
 */
var notifyCycle = function (notifier, since) {
    console.log("Checking for patch since " + since + "...");
    return versions.getPatchesSince(since).then(function (patches) {
        if (patches.length == 0) {
            console.log("No patches since " + since + ". Will check for same patch...");
            return function () {
                return notifyCycle(notifier, since);
            }
        } else {
            var latest = patches[0];
            console.log(patches.length + " new patches! Notifying + will check for patch since " + latest);
            notifier(patches, since);
            return function () {
                return notifyCycle(notifier, latest);
            }
        }
    });
}

//TODO: Move notifier to notifiers/slack.js. Make notifiers register themselves to the CLI object.

var slackNotifier = function (webhookUrl) {
    return function (patches, since) {
        var lines = ["*PATCH UP!*", "", "There are " + patches.length + " patch(es) since " + since + ":"];
        lines = R.concat(lines, R.map(function (v) {
            return " - " + v; 
        }, patches));
        var text = lines.join("\n");
        var formData = {
            payload: JSON.stringify({text: text})
        };
        request.post(webhookUrl, {
            form: formData
        }) 
    }
}

//TODO: Abstract notifyCycle + setInterval into a function that will be injected to notifiers.

var slackCmd = command.command('slack <webhookUrl>').action(function (webhookUrl, options) {
    var notifier = slackNotifier(webhookUrl);
    console.log("Starting check/notification cycle...");
    notifyCycle(notifier, command.since).then(function (exec) {
        setInterval(function () {
            exec().then(function (n) {
                exec = n;
            }) 
        }, command.frequency * 60 * 1000);
    });
});

command.parse(process.argv);
