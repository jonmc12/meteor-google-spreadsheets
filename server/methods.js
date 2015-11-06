var path = Npm.require('path');
var Future = Npm.require(path.join('fibers', 'future'));
var fs = Npm.require('fs');
var pemFile;
if (__meteor_bootstrap__ && __meteor_bootstrap__.serverDir) {
  pemFile = path.join(__meteor_bootstrap__.serverDir, 'assets/app/google-key.pem');
}
var googleAppsJson = {};

googleAppsJson = JSON.parse(fs.readFileSync('assets/app/googleapps.json', 'utf8'));

Meteor.methods({
  // Fetches from a google spreadsheet
  // key = key from googe spreadsheet publish
  // worksheet = 0-based index of worksheet
  // range = "R1C1:R5C5"
  // headerRow = 1-based index of row containing header, if there is a header
  'spreadsheet/fetch': function (key, worksheet, range, headerRow) {
    check(key, String);
    check(worksheet, Match.Optional(String))
    check(range, Match.Optional(String))
    check(headerRow, Match.Optional(Number))
    if (!worksheet) worksheet = 0;
    var fut = new Future(); //don't return until we're done importing
    GoogleSpreadsheets({
        key: key
    }, Meteor.bindEnvironment( function(error, spreadsheet) {
        if (error) {
          console.log("Error getting Google sheet with key " + key + ":", error);
          fut.return(false);
          return;
        }
        spreadsheet.worksheets[worksheet].cells({
            range: range
        }, Meteor.bindEnvironment( function(err, cells) {
          var header, data;
          //console.log("Upserting spreadsheet: ",spreadsheet.title)
          if (headerRow) {
            header = cells.cells[headerRow];
            delete cells.cells[headerRow];
          }
          data = cells.cells;
          var result = GASpreadsheet.upsert({spreadsheet: spreadsheet.title}, {$set:{header: header, cells: data}});
          fut.return(GASpreadsheet.findOne({spreadsheet: spreadsheet.title}, {fields: {_id: 1}})._id);
        }));
    }));
    return fut.wait();
  },
  'spreadsheet/fetch2': function (spreadsheetId, worksheetId, options) {
    check(spreadsheetId, String);
    check(worksheetId, Match.OneOf(String, Number));
    check(options, Object);
    var fut = new Future(); //don't return until we're done exporting

    EditGoogleSpreadsheet.load({
      //debug: true,
      spreadsheetId: spreadsheetId,
      worksheetId: worksheetId,
      oauth : {
        email: options.email,
        keyFile: pemFile,
        delegationEmail: googleAppsJson.delegationEmail
      }
    }, function sheetReady(err, spreadsheet) {
      if (err) {
        console.log(err);
        fut.return(false);
        return;
      }
      spreadsheet.receive(function(err, rows, info) {
        if (err) {
          console.log(err);
          fut.return(false);
        } else {
          fut.return({rows: rows, info: info});
        }
      });
    });
    return fut.wait();
  },
  'spreadsheet/update': function (spreadsheetName, worksheetId, updateObject, options) {
    check(spreadsheetName, String);
    check(worksheetId, Match.OneOf(String, Number));
    check(updateObject, Object);
    check(options, Object);
    var fut = new Future(); //don't return until we're done exporting

    EditGoogleSpreadsheet.load({
      //debug: true,
      spreadsheetName: spreadsheetName,
      worksheetId: worksheetId,
      oauth : {
        email: options.email,
        keyFile: pemFile
      }
    }, function sheetReady(err, spreadsheet) {
      if (err) {
        console.log(err);
        fut.return(false);
        return;
      }
      spreadsheet.add(updateObject);
      spreadsheet.send(function(err) {
        if (err) {
          console.log(err);
          fut.return(false);
        } else {
          fut.return(true);
        }
      });
    });
    return fut.wait();
  },
  'spreadsheet/update2': function (spreadsheetId, worksheetId, updateObject, options) {
    check(spreadsheetId, String);
    check(worksheetId, String);
    check(updateObject, Object);
    check(options, Object);
    var fut = new Future(); //don't return until we're done exporting
    
    EditGoogleSpreadsheet.load({
      //debug: true,
      spreadsheetId: spreadsheetId,
      worksheetId: worksheetId,
      // @TODO:jonmc12 - package can likely be updated to accept existing jwt
      oauth : {
        email: options.email,
        keyFile: pemFile,
        delegationEmail: googleAppsJson.delegationEmail
      }
    }, function sheetReady(err, spreadsheet) {
      if (err) {
        console.log("update2 error:", err);
        fut.return(false);
        return;
      }
      spreadsheet.add(updateObject);
      spreadsheet.send(function(err) {
        if (err) {
          console.log(err);
          fut.return(false);
        } else {
          console.log("updateObject: ", updateObject);
          fut.return(true);
        }
      });
    });
    return fut.wait();
  }
});
