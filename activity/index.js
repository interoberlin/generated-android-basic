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
 * Determines whether a file exists in destination
 *
 * @param file
 */
function existsInDestination(file) {
  return pathExists.sync(file);
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
					{
						value: 'empty',
						name: 'empty activity'
					}
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
						value: 'true',
						name: 'Yes'
					},
					{
						value: 'false',
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
    app: function () {
	  var packageDir = this.activityPackage.replace(/\./g, '/');
	  var okay = true;
	  
	  // Checks if activity file already exists
	  var activityFile = 'app/src/main/java/' + packageDir + '/' + this.activityName + '.java';
	  if (existsInDestination(this.destinationPath(activityFile))) {
		  console.log(chalk.red('    error') + ' activity ' + activityFile + ' already exists');
		  okay = false;
	  }
	  
	  // Check if layout file already exists
	  var layoutFile = 'app/src/main/res/layout/' + this.layoutName + '.xml';
	  if (existsInDestination(this.destinationPath(layoutFile))) {
		  console.log(chalk.red('    error') + ' layout ' + layoutFile + ' already exists');
		  okay = false;
	  }
	  
	  if (okay) {
		  // activity
		  this.mkdir('app/src/main/java/' + packageDir);	  
		  this.template('app/src/main/java/view/activities/_' + this.activityType.toString().capitalizeFirst() + 'Activity.java', activityFile);
	  	  
		  // resources
		  this.mkdir('app/src/main/res/layout');
		  this.mkdir('app/src/main/res/values');
		  this.mkdir('app/src/main/res/values-w820p');
		  this.template('app/src/main/res/layout/activity_' + this.activityType + '.xml', layoutFile);
		  this.copy('app/src/main/res/values/dimens.xml', 'app/src/main/res/values/dimens.xml');
		  this.copy('app/src/main/res/values-w820dp/dimens.xml', 'app/src/main/res/values-w820p/dimens.xml');
		  
		  // manifest 
		  var manifestFile = this.destinationPath('app/src/main/AndroidManifest.xml');
		  var manifest = this.readFileAsString(manifestFile);
		  
		  if (this.launcher) {
			if (!manifest.contains('LAUNCHER')) {
			// Add launcher activity
			wiring.prependToFile (manifestFile, 'application',
				'\n<activity android:name=".view.activities.' + this.activityName + '">' + 
					'\n<intent-filter>' + 
						'\n<action android:name="android.intent.action.MAIN"></action>' + 
						'\n<category android:name="android.intent.category.LAUNCHER"></category>' + 
					'\n</intent-filter>' + 
				'\n</activity>');
			} else {
				// Add normal activity
				wiring.prependToFile (manifestFile, 'application', '\n<activity android:name=".view.activities.' + this.activityName + '" />');
				console.log(chalk.yellow('     warn') + ' manifest already contains an activity with launcher intent');
			}
			
			console.log(chalk.cyan('   update') + ' app/src/main/AndroidManifest.xml');
		  } else {
			// Add normal activity
			wiring.prependToFile (manifestFile, 'application', '\n<activity android:name=".view.activities.' + this.activityName + '" />');
			console.log(chalk.cyan('   update') + ' app/src/main/AndroidManifest.xml');
		  }
	    }
    }
  }
});
