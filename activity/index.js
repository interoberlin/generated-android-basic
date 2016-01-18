'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');
var wiring = require('html-wiring');
var pathExists = require('path-exists');

/**
 * Functionally the same as directory however applies templating if file name begins with an underscore (_).
 *
 * @param source
 * @param destination
 */
function templateDirectory(source, destination) {
  var root = this.isPathAbsolute(source) ? source : path.join(this.sourceRoot(), source);
  var files = this.expandFiles('**', { dot: true, cwd: root });

  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    var src = path.join(root, f);
    if(path.basename(f).indexOf('_') == 0){
      var dest = path.join(destination, path.dirname(f), path.basename(f).replace(/^_/, ''));
      this.template(src, dest);
    }
    else{
      var dest = path.join(destination, f);
      this.copy(src, dest);
    }
  }
}

/**
 * Determines whether a file exists
 *
 * @param file
 */
function exists(file) {
  return pathExists.sync(file);
}

/**
 * Copies a file from template to destination if missing
 *
 * @param file
 * @param destinationPath
 */
function copyIfMissing(file, destinationPath) {
	if (!exists(destinationPath)) { this.copy(file, file); }
}

String.prototype.camelCaseToSnakeCase = function() {
    return this.replace(/\.?([A-Z]+)/g, function (x,y){return "_" + y.toLowerCase()}).replace(/^_/, "");
}

String.prototype.capitalizeFirst = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.removeTrailingActivity = function() {
	return this.replace(/Activity$/, '');
}

String.prototype.contains = function(substring) {
	return this.indexOf(substring) > -1;
}

module.exports = yeoman.generators.Base.extend({
	constructor: function () {
    yeoman.generators.Base.apply(this, arguments);

	this.argument('activityType', { type: String, required: false });
	this.argument('activityName', { type: String, required: false });
	this.argument('layoutPackage', { type: String, required: false });
	this.argument('layoutName', { type: String, required: false });
	this.argument('launcher', { type: String, required: false });
  },
  
  initializing: function () {
    this.pkg = require('../package.json');
    this.templateDirectory = templateDirectory.bind(this);
	this.okay = true;
  },

  prompting: {  
	promptActivityType : function () {
		if (this.activityType == null) {
			var questions = 5;
			var done = this.async();
			var prompts = [
			{
				type: 'list',
				name: 'activityType',
				message: '(1/' + questions + ') Which ' + chalk.green('type') + ' of activity would you like to create?',
				choices: [
					{ value: 'empty', name: 'empty activity' },
					{ value: 'blank', name: 'blank activity' },
					{ value: 'fullscreen', name: 'fullscreen activity'}
				],
				store: true,
				default: 0
			}];
			
			this.prompt(prompts, function (props) {
			  this.activityType = props.activityType;

			  done();
			}.bind(this));
		}
	},
	
	promptActivityName : function () {
		if (this.activityName == null) {
			var questions = 5;
			var done = this.async();
			var prompts = [
			{
			  name: 'activityName',
			  message: '(2/' + questions + ') What are you calling your activity?',
			  store: true,
			  default: this.activityType.toString().capitalizeFirst() + 'Activity',
			}];
			
			this.prompt(prompts, function (props) {
			  this.activityName = props.activityName;

			  done();
			}.bind(this));
		}
	},
	
	promptRest : function () {
		if (this.activityPackage == null || this.layoutName == null || this.launcher == null) {
			var questions = 5;
			var appPackage = this.config.get("appPackage");
			var done = this.async();
			var prompts = [
			{
			  name: 'activityPackage',
			  message: '(3/' + questions + ') Under which package you want to create the activity?',
			  store: true,
			  default: appPackage + '.view.activities',
			},
			{
			  name: 'layoutName',
			  message: '(4/' + questions + ') What are you calling the corresponding layout?',
			  store: true,
			  default: 'activity_' + this.activityName.toString().removeTrailingActivity().camelCaseToSnakeCase()
			},
			{
			  type: 'list',
			  name: 'launcher',
			  message: '(5/' + questions + ') Should this activity be started on launch?',
			  choices: [
					{
						value: true,
						name: 'Yes'
					},
					{
						value: false,
						name: 'No'
					}
				],
				store: true,
				default: 1,
			}];

			this.prompt(prompts, function (props) {
			  this.activityPackage = props.activityPackage;
			  this.layoutName = props.layoutName;
			  this.launcher = props.launcher;

			  done();
			}.bind(this));
		}
	}
  },

  configuring: {
    saveSettings: function() {
      this.config.set('activityType', this.activityType);
      this.config.set('activityName', this.activityName);
      this.config.set('activityPackage', this.activityPackage);
      this.config.set('layoutName', this.layoutName);
      this.config.set('launcher', this.launcher);
    }
  },

  writing: {
    check: function () {
	  var packageDir = this.activityPackage.replace(/\./g, '/');
	  var activityFile = 'app/src/main/java/' + packageDir + '/' + this.activityName + '.java';
	  var layoutFile = 'app/src/main/res/layout/' + this.layoutName + '.xml';
	  
	  // Checks if activity file already exists
	  if (exists(this.destinationPath(activityFile))) {
		  console.log(chalk.red('    error') + ' activity ' + activityFile + ' already exists');
		  this.okay = false;
	  }

	  // Check if layout file already exists
	  if (exists(this.destinationPath(layoutFile))) {
		  console.log(chalk.red('    error') + ' layout ' + layoutFile + ' already exists');
		  this.okay = false;
	  }
	},
	
	activity: function () {
	  if (this.okay) {
		  var packageDir = this.activityPackage.replace(/\./g, '/');
		  var activityFile = 'app/src/main/java/' + packageDir + '/' + this.activityName + '.java';
		  
		  this.mkdir('app/src/main/java/' + packageDir);	  
		  this.template('app/src/main/java/view/activities/_' + this.activityType.toString().capitalizeFirst() + 'Activity.java', activityFile);
	  }
	},
	
	res: function () {
	  if (this.okay) {
		  var stringsFile = 'app/src/main/res/values/strings.xml';
		  var dimensFile = 'app/src/main/res/values/dimens.xml';
		  var colorsFile = 'app/src/main/res/values/colors.xml';
		  
		  var stringsUpdated = false;
		  var dimensUpdated = false;
		  var colorsUpdated = false;
		  
		  var stringsFileDest = this.destinationPath(stringsFile);
		  var dimensFileDest = this.destinationPath(dimensFile);
		  var colorsFileDest = this.destinationPath(colorsFile);
		  
		  this.mkdir('app/src/main/res/values');
		  
		  switch (this.activityType.toString()) {
			  case 'empty' : {
				copyIfMissing(stringsFile, this.destinationPath(stringsFile));
				copyIfMissing(dimensFile, this.destinationPath(dimensFile));
				
				var strings = this.readFileAsString(stringsFileDest);
				var dimens = this.readFileAsString(dimensFileDest);	
				
				if (!strings.contains('title_' + this.layoutName)) { 
					wiring.appendToFile (stringsFileDest, 'resources', '\t<string name="title_' + this.layoutName + '">' + this.activityName.toString().removeTrailingActivity() + '</string>  \n');
					stringsUpdated = true;
				}
				if (!dimens.contains('activity_horizontal_margin')) {
					wiring.appendToFile (dimensFileDest, 'resources', '\t<dimen name="activity_horizontal_margin">16dp</dimen>\n');
					dimensUpdated = true;
				}
				if (!dimens.contains('activity_vertical_margin')) {
					wiring.appendToFile (dimensFileDest, 'resources', '\t<dimen name="activity_vertical_margin">16dp</dimen>\n');
					dimensUpdated = true;
				}
				
				if (dimensUpdated) { console.log(chalk.cyan('   update') + ' ' + dimensFile); }
				if (stringsUpdated) { console.log(chalk.cyan('   update') + ' ' + stringsFile);}
				break;  
			  }
			  case 'blank' : {
				copyIfMissing(stringsFile, this.destinationPath(stringsFile));
				copyIfMissing(dimensFile, this.destinationPath(dimensFile));
				
				var strings = this.readFileAsString(stringsFileDest);
				var dimens = this.readFileAsString(dimensFileDest);
				
				if (!strings.contains('title_' + this.layoutName)) {
					wiring.appendToFile (stringsFileDest, 'resources', '\t<string name="title_' + this.layoutName + '">' + this.activityName.toString().removeTrailingActivity() + '</string>  \n');
					stringsUpdated = true;
				}
				if (!dimens.contains('<dimen name="activity_horizontal_margin">')) {
					wiring.appendToFile (dimensFileDest, 'resources', '\t<dimen name="activity_horizontal_margin">16dp</dimen>\n');
					dimensUpdated = true;
				}
				if (!dimens.contains('<dimen name="activity_vertical_margin">')) {
					wiring.appendToFile (dimensFileDest, 'resources', '\t<dimen name="activity_vertical_margin">16dp</dimen>\n');
					dimensUpdated = true;
				}
				
				if (dimensUpdated) { console.log(chalk.cyan('   update') + ' ' + dimensFile); }
				if (stringsUpdated) { console.log(chalk.cyan('   update') + ' ' + stringsFile);}
				break;
			  }
			  case 'fullscreen' : {
				copyIfMissing(dimensFile, this.destinationPath(dimensFile));
				copyIfMissing(colorsFile, this.destinationPath(colorsFile));
				
				var strings = this.readFileAsString(stringsFileDest);
				var colors = this.readFileAsString(colorsFileDest);
				
				if (!strings.contains('title_' + this.layoutName)) { 
					wiring.appendToFile (stringsFileDest, 'resources', '\t<string name="title_' + this.layoutName + '">' + this.activityName.toString().removeTrailingActivity() + '</string>  \n');
					stringsUpdated = true;
				}
				if (!strings.contains('<string name="dummy_content">')) {
					wiring.appendToFile (stringsFileDest, 'resources', '\t<string name="dummy_content">DUMMY\nCONTENT</string>\n');
					stringsUpdated = true;
				}
				
				if (!strings.contains('<string name="dummy_button">')) {
					wiring.appendToFile (stringsFileDest, 'resources', '\t<string name="dummy_button">Dummy Button</string>\n');
					stringsUpdated = true;
				}
				
				if (!colors.contains('<color name="black_overlay">')) {
					wiring.appendToFile (colorsFileDest, 'resources', '\t<color name="black_overlay">#66000000</color>\n');
					colorsUpdated = true;
				}
  
  				if (stringsUpdated) { console.log(chalk.cyan('   update') + ' ' + stringsFile); }
  				if (colorsUpdated) { console.log(chalk.cyan('   update') + ' ' + colorsFile); }
				break;
			  }
		  }
	  }
	},
	
	layout: function () {
	  if (this.okay) {
		  var layoutFile = 'app/src/main/res/layout/' + this.layoutName + '.xml';
		  
		  this.mkdir('app/src/main/res/layout');
		  this.template('app/src/main/res/layout/_activity_' + this.activityType + '.xml', layoutFile);
	  }
	},
	
	manifest: function () {
	  if (this.okay) {			  
		  var manifestFile = this.destinationPath('app/src/main/AndroidManifest.xml');
		  var manifest = this.readFileAsString(manifestFile);
		  
		  if (this.launcher) {
			if (!manifest.contains('LAUNCHER')) {
			// Add launcher activity
			wiring.appendToFile (manifestFile, 'application',
				'\n\t<activity android:name=".view.activities.' + this.activityName + '" android:label="@string/title_' + this.layoutName + '" />\n' + 
					'\t<intent-filter>\n' + 
						'\t<action android:name="android.intent.action.MAIN"></action>\n' + 
						'\t<category android:name="android.intent.category.LAUNCHER"></category>\n' + 
					'\t</intent-filter>\n' + 
				'\t</activity>\n');
			} else {
				// Add normal activity
				wiring.appendToFile (manifestFile, 'application', '\n\t<activity android:name=".view.activities.' + this.activityName + '" android:label="@string/title_' + this.layoutName + '" />\n');
				console.log(chalk.yellow('     warn') + ' manifest already contains an activity with launcher intent');
			}
			
			console.log(chalk.cyan('   update') + ' app/src/main/AndroidManifest.xml');
		  } else {
			// Add normal activity
			wiring.appendToFile (manifestFile, 'application', '\n\t<activity android:name=".view.activities.' + this.activityName + '" android:label="@string/title_' + this.layoutName + '" />\n');
			console.log(chalk.cyan('   update') + ' app/src/main/AndroidManifest.xml');
		  }
	  }
    }
  }
});
