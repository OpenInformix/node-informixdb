/*
  Copyright (c) 2017, 2020 OpenInformix.
  Copyright (c) 2014, IBM Corporation.
  Copyright (c) 2013, Dan VerWeire <dverweire@gmail.com>
  Copyright (c) 2010, Lee Smith <notwink@gmail.com>

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted, provided that the above
  copyright notice and this permission notice appear in all copies.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
  WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
  MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
  ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
  WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
  ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
  OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

/**
 * Node-informixdb Installer file.
 */

var fs = require('fs');
var os = require('os');
var path = require('path');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var url = require('url');
var request = require('request');
var unzipper = require('unzipper');

var platform = os.platform();
var CURRENT_DIR = process.cwd();
var DOWNLOAD_DIR = path.resolve(CURRENT_DIR, 'installer');
var INSTALLER_FILE;
var BUILD_FILE;
var deleteInstallerFile = false;
var arch = os.arch();

var vscode_build = false;
var readStream;
var writeStream;

/*
 * "process.env.CSDK_INSTALLER_URL"
 * USE: to by-pass the provided URL for downloading the Informix cli/ODBC driver.
 * HOW: set environment variable with alternate downloading URL link.
 *      or locally downloaded "tar/zipped onedb-odbc-driver's" parent directory path.
 *      You can add CSDK_INSTALLER_URL in .npmrc file too.
 */
//URL for downloading Informix ODBC/CLI driver.
var installerURL = 'https://hcl-onedb.github.io/odbc';
var license_agreement = '\n\n****************************************\nYou are downloading a package which includes the Node.js module for HCL/IBM Informix. The module is licensed under the Apache License 2.0. Check for additional dependencies, which may come with their own license agreement(s). Your use of the components of the package and dependencies constitutes your acceptance of their respective license agreements. If you do not accept the terms of any license agreement(s), then delete the relevant component(s) from your device.\n****************************************\n';
installerURL = process.env.npm_config_CSDK_INSTALLER_URL ||
               process.env.CSDK_INSTALLER_URL || installerURL;
installerURL = installerURL + "/";

var CSDK_HOME, CSDK_INCLUDE, CSDK_LIB;

InstallNodeInformixDB();

// Function to download and install node-informixdb
function InstallNodeInformixDB() {
    checkDriverCompatibilityForOSAndNodejsVersion();

    var installerfileURL;

    /*
     * Installer steps: Generic for all platforms :
     * 1: Check CSDK_HOME path first, if present then install accordingly.
     * 2: If CSDK_HOME is not set, then download "onedb-odbc-driver" and then install.
     *
     * Installer Steps: For windows only :
     * Step 1 and Step 2 are same.
     * There are two kinds of windows installation now:
     * 1: Auto Installation (Compilation and building - required Visual Studio).
     * 2: Pre-compiled Binary Installation.
     *
     * If in any case "Auto Installation" fails, then the Installer will
     * automatically pick up the "Pre-compiled Binary Installation"" process.
     *
     */

    //If building for supporting VSCode Extn, then remove onedb-odbc-driver folder and get it freshly
    if(vscode_build && fs.existsSync(path.join(DOWNLOAD_DIR,'onedb-odbc-driver'))){
        deleteFolderRecursive(path.join(DOWNLOAD_DIR,'onedb-odbc-driver'))
    }

    /*
     * IF: CSDK_HOME path is set ->
     * CASE 1: If "CSDK_HOME" environment variable path is set.
     * CASE 2: If "npm rebuild" and onedb-odbc-driver exists at DOWNLOAD_DIR location.
     * onedb-odbc-driver will not get download from remote location
     * node-informixdb will use local onedb-odbc-driver package stored in-
     * CSDK_HOME path location.
     * ELSE: platform specific compressed onedb-odbc-driver package will be download
     * and then extract for further use.
     */

    if (process.env.CSDK_HOME || process.env.INFORMIXDIR || fs.existsSync(DOWNLOAD_DIR + "/onedb-odbc-driver"))
    {
        var IS_ENVIRONMENT_VAR;
        if (process.env.CSDK_HOME) {
            CSDK_HOME = process.env.CSDK_HOME;
            IS_ENVIRONMENT_VAR = true;
            console.log('\nFOUND: CSDK_HOME environment variable : ' + CSDK_HOME +
                '\nACTION: Build is in progress...\n');
        }
        else if (process.env.INFORMIXDIR) {
            CSDK_HOME = process.env.INFORMIXDIR;
            process.env.CSDK_HOME = CSDK_HOME.replace(/\s/g, '\\ ');
            IS_ENVIRONMENT_VAR = true;
            console.log('\nFOUND: INFORMIXDIR environment variable : ' + CSDK_HOME +
                '\nACTION: Build is in progress...\n');
        }
        else if (fs.existsSync(DOWNLOAD_DIR + "/onedb-odbc-driver")){
            CSDK_HOME = path.resolve(DOWNLOAD_DIR, 'onedb-odbc-driver');
            process.env.CSDK_HOME = CSDK_HOME.replace(/\s/g,'\\ ');
            IS_ENVIRONMENT_VAR = false;
        }

        checkCSDKInternalDirs();

        if (IS_ENVIRONMENT_VAR) {
            console.log('CSDK_HOME environment variable have already been ' +
                'set to -> ' + CSDK_HOME + '\n\nDownloading of onedb-odbc-driver skipped - build is in progress...\n');
        } else {
            console.log('Rebuild Process: Found onedb-odbc-driver at -> '+ CSDK_HOME +
                '\n\nDownloading of onedb-odbc-driver skipped - build is in progress...\n');
        }

        if (platform != 'win32') {
            if (!fs.existsSync(CSDK_HOME + "/lib"))
                fs.symlinkSync(CSDK_LIB, path.resolve(CSDK_HOME, 'lib'));

            if ((platform == 'linux') || (platform == 'aix') ||
                (platform == 'darwin' && arch == 'x64')) {
                buildDriverAndGenerateBinary(!IS_ENVIRONMENT_VAR);
            }
        }
        else if (platform == 'win32' && arch == 'x64') {
            buildDriverAndGenerateBinary(!IS_ENVIRONMENT_VAR);
        }
        else {
            console.log('\nBuilding binaries for node-informixdb. This platform ' +
                'is not completely supported, you might encounter errors. ' +
                'In such cases please open an issue on our repository, ' +
                'https://github.com/OpenInformix/node-informixdb. \n');
        }
    }
    else {
        if(platform == 'win32') {
            if(arch == 'x64') {
                installerfileURL = installerURL + 'OneDB-Win64-ODBC-Driver.zip';
            }
        }
        else if(platform == 'linux')
        {
            if(arch == 'x64') {
                installerfileURL = installerURL + 'OneDB-Linux64-ODBC-Driver.tar.gz';
            } else {
                console.log('Node-Informixdb does not support other Linux flavours. Exiting the ' +
                        'install process.\n');
                process.exit(1);
            }
        }
        else if(platform == 'darwin')
        {
            console.log('Node-Informixdb does not support MAC OS. Exiting the ' +
                        'install process.\n');
            process.exit(1);
        }
        else if(platform == 'aix')
        {
            console.log('Node-Informixdb does not support AIX OS. Exiting the ' +
                        'install process.\n');
            process.exit(1);
        }
        else if(platform == 'os390')
        {
            console.log('Node-Informixdb does not support OS390. Exiting the ' +
                        'install process.\n');
            process.exit(1);
        }
        else
        {
            console.log('Node-Informixdb does not support this OS platform. Exiting the ' +
                        'install process.\n');
            process.exit(1);
        }

        if(!installerfileURL) {
            console.log('Unable to fetch driver download file. Exiting the ' +
                        'install process.\n');
            process.exit(1);
        }

        var file_name = url.parse(installerfileURL).pathname.split('/').pop();
        INSTALLER_FILE = path.resolve(DOWNLOAD_DIR, file_name);

        console.log('Downloading Informix ODBC CLI Driver from ' +
                    installerfileURL+'...\n');

        fs.stat(installerfileURL, function (err, stats) {
            if (!err && stats.isFile()) {
                INSTALLER_FILE = installerfileURL;
                return copyAndExtractODBCDriver();
            }
            return downloadODBCDriver(installerfileURL);
        });
    }  // * END OF EXECUTION */
}; //InstallNodeInformixDB

function checkDriverCompatibilityForOSAndNodejsVersion() {
    console.log("\nPlatform = ", platform, ", Arch = ", arch, ", Node.js version = ", process.version);
    if ((platform == 'win32' && arch == 'x64') || platform == 'linux') {
        // Add-on binaries for node.js version less than 10.0 has been discontinued.
        if (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 10.0) {
            console.log('\nERROR: node-informixdb does not provide compilation and precompiled add-on binary support for node.js version < 10.X on Windows & Linux platforms.' +
                ' Please use the node.js version >= 10.X\n');
            process.exit(1);
        }
    }
    else {
        console.log('\nERROR: Platform: ' + platform + ' with arch: ' + arch + ' is not supported. Please use a supported OS platform.\n');
        process.exit(1);
    }
};

function checkCSDKInternalDirs() {
    CSDK_INCLUDE = path.resolve(CSDK_HOME, 'incl/cli');
    CSDK_LIB = path.resolve(CSDK_HOME, 'lib');

    if (!fs.existsSync(CSDK_HOME)) {
        console.log('\nERROR:' + CSDK_HOME + ' directory does not exist. Please check if you have ' +
            'set the CSDK_HOME environment variable\'s value correctly.\n');
        process.exit(1);
    }
    if (!fs.existsSync(CSDK_INCLUDE)) {
        console.log('\nERROR:' + CSDK_INCLUDE + ' directory does not exist. Please check if you have ' +
            'set the CSDK_HOME environment variable\'s value correctly.\n');
        process.exit(1);
    }
    if (!fs.existsSync(CSDK_LIB)) {
        console.log('\nERROR:' + CSDK_LIB + ' directory does not exist. Please check if you have ' +
            'set the CSDK_HOME environment variable\'s value correctly.\n');
        process.exit(1);
    }
};

function buildDriverAndGenerateBinary(isDownloaded) {
    var buildString = "node-gyp configure build ";

    if(isDownloaded) {
        buildString = buildString + " --IS_DOWNLOADED=true";
    } else {
        buildString = buildString + " --IS_DOWNLOADED=false";
    }

    // Clean existing build directory
    removeDir('build');

    // Windows : Auto Installation Process -> 1) node-gyp
    if (platform == 'win32' && arch == 'x64') {
        var buildString = buildString + " --CSDK_HOME=\$CSDK_HOME";

        var childProcess = exec(buildString, function (error, stdout, stderr) {
            console.log(stdout);

            if (error !== null) {
                console.log('\nERROR: node-gyp build process failed! \n' + error);
                installPreCompiledBinary();
                return;
            } else {
                console.log("\n" +
                "=======================================\n" +
                "node-informixdb installed successfully!\n" +
                "=======================================\n");
            }
        });
    }
    else {
        var buildString = buildString + " --CSDK_HOME=\"$CSDK_HOME\"";
        var childProcess = exec(buildString, function (error, stdout, stderr) {
            console.log(stdout);
            if (error !== null) {
                console.log('\nERROR: node-gyp build process failed! \n' + error);
                installPreCompiledBinary();
                return;
            } else {
                console.log("\n" +
                "=======================================\n" +
                "node-informixdb installed successfully!\n" +
                "=======================================\n");
            }
        });
    }
}; //buildDriverAndGenerateBinary

function installPreCompiledBinary() {
    console.log('\nACTION: Proceeding with Pre-compiled Binary Installation. \n');
    if (!process.env.CSDK_HOME || !process.env.INFORMIXDIR || !fs.existsSync(DOWNLOAD_DIR + "/onedb-odbc-driver"))
    {
        console.log('\nNo prior CSDK/ODBC installation/directory found. Please check if you have ' +
                'set the CSDK_HOME/INFORMIXDIR environment variable\'s value correctly.\n');
        console.log('\nERROR: Installation Failed! \n');
        process.exit(1);
    }
    var fstream = require('fstream');
    // build.zip file contains all the pre-compiled binary files
    BUILD_FILE = path.resolve(CURRENT_DIR, 'build.zip');

    // This will always be the final installation name/path for all the binaries
    var ODBC_BINDINGS = 'build\/Release\/odbc_bindings.node';

    // Supported Node.js versions bonaries
    var ODBC_BINDINGS_V8, ODBC_BINDINGS_V9, ODBC_BINDINGS_V10, ODBC_BINDINGS_V11, ODBC_BINDINGS_V12, ODBC_BINDINGS_V13, ODBC_BINDINGS_V14

    if (platform == 'win32' && arch == 'x64') {
        // Windows node binary names should update here.
        ODBC_BINDINGS_V10 = 'build\/Release\/odbc_bindings_win64.node.10.16.0';
        ODBC_BINDINGS_V11 = 'build\/Release\/odbc_bindings_win64.node.11.15.0';
        ODBC_BINDINGS_V12 = 'build\/Release\/odbc_bindings_win64.node.12.15.0';
        ODBC_BINDINGS_V13 = 'build\/Release\/odbc_bindings_win64.node.13.14.0';
        ODBC_BINDINGS_V14 = 'build\/Release\/odbc_bindings_win64.node.14.9.0';
    }
    else if (platform = 'linux') {
        // Linux node binary names should update here.
        ODBC_BINDINGS_V10 = 'build\/Release\/odbc_bindings_linux.node.10.16.0';
        ODBC_BINDINGS_V11 = 'build\/Release\/odbc_bindings_linux.node.11.15.0';
        ODBC_BINDINGS_V12 = 'build\/Release\/odbc_bindings_linux.node.12.15.0';
        ODBC_BINDINGS_V13 = 'build\/Release\/odbc_bindings_linux.node.13.14.0';
        ODBC_BINDINGS_V14 = 'build\/Release\/odbc_bindings_linux.node.14.9.0';
    }

    /*
    * odbcBindingsNode will consist of the node binary-
    * file name according to the node version in the system.
    */
    var odbcBindingsNode = (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 9.0) && ODBC_BINDINGS_V8 ||
        (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 10.0) && ODBC_BINDINGS_V9 ||
        (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 11.0) && ODBC_BINDINGS_V10 ||
        (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 12.0) && ODBC_BINDINGS_V11 ||
        (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 13.0) && ODBC_BINDINGS_V12 ||
        (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 14.0) && ODBC_BINDINGS_V13 || ODBC_BINDINGS_V14;

    // Removing the "build" directory created by Auto Installation Process.
    // "unzipper" will create a fresh "build" directory for extraction of "build.zip".
    removeDir('build');

    readStream = fs.createReadStream(BUILD_FILE);

    /*
    * unzipper will parse the build.zip file content and
    * then it will check for the odbcBindingsNode
    * (node Binary), when it gets that binary file,
    * fstream.Writer will write the same node binary
    * but the name will be odbc_bindings.node, and the other
    * binary files and build.zip will be discarded.
    */
    readStream.pipe(unzipper.Parse())
        .on('entry', function (entry) {
            if (entry.path === odbcBindingsNode) {
                entry.pipe(fstream.Writer(ODBC_BINDINGS));
            } else {
                entry.autodrain();
            }
        })
        .on('error', function (e) {
            console.log('\nERROR: Installation Failed! \n', e);
            process.exit(1);
        })
        .on('finish', function () {
            console.log("\n" +
            "=======================================\n" +
            "node-informixdb installed successfully!\n" +
            "=======================================\n");
        });
    return 1;
};

// Function to download onedb-odbc-driver file using request module.
function downloadODBCDriver(installerfileURL) {
    // Variable to save downloading progress
    var received_bytes = 0;
    var total_bytes = 0;

    var outStream = fs.createWriteStream(INSTALLER_FILE);

    request
        .get(installerfileURL)
            .on('error', function(err) {
                console.log('\nERROR: downloading onedb-odbc-driver process failed! \n' + err);
                installPreCompiledBinary();
                return;
            })
            .on('response', function(data) {
                total_bytes = parseInt(data.headers['content-length']);
            })
            .on('data', function(chunk) {
                received_bytes += chunk.length;
                showDownloadingProgress(received_bytes, total_bytes);
            })
            .pipe(outStream);

    deleteInstallerFile = true;
    outStream.once('close', copyAndExtractODBCDriver)
    .once('error', function (err) {
        console.log('\nERROR: extraction of onedb-odbc-driver failed! \n' + err);
        installPreCompiledBinary();
        return;
    });
};

function showDownloadingProgress(received, total) {
    var percentage = ((received * 100) / total).toFixed(2);
    process.stdout.write((platform == 'win32') ? "\033[0G": "\r");
    process.stdout.write(percentage + "% | " + received + " bytes downloaded out of " + total + " bytes.");
};

function copyAndExtractODBCDriver() {
    if(platform == 'win32') {
        readStream = fs.createReadStream(INSTALLER_FILE);
        // Using the "unzipper" module to extract the zipped "onedb-odbc-driver",
        // and on successful close, printing the license_agreement
        var extractODBCDriver = readStream.pipe(unzipper.Extract({path: DOWNLOAD_DIR}));

        extractODBCDriver.on('close', function() {
            console.log(license_agreement);
            console.log('Downloading and extraction of Informix ODBC ' +
                'CLI Driver completed successfully... \n');
            CSDK_HOME = path.resolve(DOWNLOAD_DIR, 'onedb-odbc-driver');
            process.env.CSDK_HOME = CSDK_HOME.replace(/\s/g,'\\ ');
            checkCSDKInternalDirs();
            buildDriverAndGenerateBinary(true);
            removeFile(BUILD_FILE);
            if(deleteInstallerFile) removeFile(INSTALLER_FILE);
        });
        extractODBCDriver.on('err', function() {
            console.log('\nERROR: extraction of onedb-odbc-driver failed! \n' + err);
            installPreCompiledBinary();
            return;
        });
    }
    else
    {
        var targz = require('targz');
        var decompress = targz.decompress({src: INSTALLER_FILE, dest: DOWNLOAD_DIR}, function(err){
            if(err) {
                console.log('\nERROR: extraction of onedb-odbc-driver failed! \n' + err);
                installPreCompiledBinary();
                return;
            }
            else {
                console.log(license_agreement);
                console.log('Downloading and extraction of Informix ODBC ' +
                    'CLI Driver completed successfully... \n');
                CSDK_HOME = path.resolve(DOWNLOAD_DIR, 'onedb-odbc-driver');
                process.env.CSDK_HOME = CSDK_HOME.replace(/\s/g,'\\ ');
                checkCSDKInternalDirs();
                buildDriverAndGenerateBinary(true);
                removeFile(BUILD_FILE);
                if(deleteInstallerFile) removeFile(INSTALLER_FILE);
            }
        });
    }
};

function removeDir(dir) {
    var fullPath = path.resolve(CURRENT_DIR, dir);
    if (fs.existsSync(fullPath)) {
        if (platform == 'win32') {
            execSync("rmdir /s /q " + '"' + fullPath + '"');
        } else {
            execSync("rm -rf " + '"' + fullPath + '"');
        }
    }
};

function removeFile(FILE_PATH)
{
    // Delete downloaded odbc_cli.tar.gz file.
    fs.exists(FILE_PATH, function(exists)
    {
        if (exists)
        {
            fs.unlinkSync(FILE_PATH);
        }
    });
};

function deleteFolderRecursive(p){
    if (fs.existsSync(p)) {
        fs.readdirSync(p).forEach(function(file, index){
            var curPath = path.join(p, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            }else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(p);
    }
};
