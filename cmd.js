#!/usr/bin/env node

var versions = require('./lib/versions');
var command = require('commander');
var R = require('ramda');
var request = require('request');
var Promise = require("bluebird");

command.option('-s, --since <v>', 'Patch number (i.e. 5.19)');
command.option('-f, --frequency <minutes>', 'Check & notification frequency');


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

var daemon = function (notifier, since) {
    console.log("Checking for patch since " + since + "...");
    return versions.getPatchesSince(since).then(function (patches) {
        if (patches.length == 0) {
            console.log("No patches since " + since + ". Will check for same patch...");
            return function () {
                return daemon(notifier, since);
            }
        } else {
            var latest = patches[0];
            console.log(patches.length + " new patches! Notifying + will check for patch since " + latest);
            notifier(patches, since);
            return function () {
                return daemon(notifier, latest);
            }
        }
    })
}

var slackCmd = command.command('slack <webhookUrl>')
.action(function (webhookUrl, options) {
    var notifier = slackNotifier(webhookUrl);
    console.log("Starting check/notification deamon...");
    daemon(notifier, command.since).then(function (exec) {
        setInterval(function () {
            exec().then(function (n) {
                exec = n;
            }) 
        }, command.frequency * 60 * 1000);
    });
});

command.parse(process.argv);
