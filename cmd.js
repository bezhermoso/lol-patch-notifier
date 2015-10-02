#!/usr/bin/env node

var versions = require('./lib/versions');
var command = require('commander');
var R = require('ramda');
var request = require('request');

command.option('-s, --since <v>', 'Patch number (i.e. 5.19)');


var slackNotifier = function (webhookUrl) {
    return function (patches) {
        var lines = ["*PATCH UP!*", "", "There are " + patches.length + " patch(es):"];
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

var slackCmd = command.command('slack <webhookUrl>')
    .action(function (webhookUrl, options) {
        var notifier = slackNotifier(webhookUrl);
        versions.getPatchesSince(command.since).then(function (patches) {
            if (patches.length == 0) {
                console.log("No patches since " + command.since);
            } else {
                console.log('Notifying Slack...');
                notifier(patches);
            }
        });
    });

command.parse(process.argv);
