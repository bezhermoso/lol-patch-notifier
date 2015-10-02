
const Promise = require('bluebird');
const get = Promise.promisify(require('request').get);
const R = require('ramda');

var getVersions = function () {
    return get('https://ddragon.leagueoflegends.com/api/versions.json')
            .then(R.compose(JSON.parse, R.nth(1)));
}

var patchVersion = function (v) {
    var pattern = /^lolpatch_([0-9]+\.[0-9]+)$/;
    var matches = v.match(pattern);
    return matches ? matches[1] : null;
};

var getPatches = function () {
    return exports.getVersions().then(R.filter(patchVersion));
};

var getPatchesSince = function (v) {
    return getPatches()
        .then(R.map(patchVersion))
        .then(function(patches) {
            var i = patches.indexOf(v);
            return patches.slice(0, 1);
        });
}

exports.getVersions = getVersions;
exports.patchVersion = patchVersion;
exports.getPatches = getPatches;
exports.getPatchesSince = getPatchesSince;
