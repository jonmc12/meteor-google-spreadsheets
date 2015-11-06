Package.describe({
  summary: "Google Spreadsheets",
  name: "jonmc12:google-spreadsheets",
  version: "0.4.2_5",
  git: "https://github.com/jonmc12/meteor-google-spreadsheets"
});

Npm.depends({
  "google-spreadsheets": "0.4.2",
  "googleclientlogin": "0.2.8",
  "edit-google-spreadsheet": "0.2.19"
});

Package.on_use(function (api) {
  api.versionsFrom("METEOR@0.9.0");
  api.imply(["underscore"], ["client", "server"]);
  api.use("check");
  api.use("mongo@1.1.2");
  api.export('GoogleSpreadsheets');
  api.export('GoogleClientLogin');
  api.export('GASpreadsheet');
  api.addFiles('client/subscriptions.js', 'client');
  api.addFiles('common/collections.js', ['client','server']);
  api.addFiles('server/methods.js', 'server');
  api.addFiles('server/publications.js', 'server');
  api.addFiles('google-spreadsheets.js', 'server');
});
