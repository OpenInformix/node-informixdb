/*
  Copyright (c) 2017, 2020 OpenInformix (HCL Technologies).
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

var license_agreement = '\n\n****************************************\nYou are downloading a package which includes the Node.js module for HCL/IBM Informix. The module is licensed under the Apache License 2.0. Check for additional dependencies, which may come with their own license agreement(s). Your use of the components of the package and dependencies constitutes your acceptance of their respective license agreements. If you do not accept the terms of any license agreement(s), then delete the relevant component(s) from your device.\n****************************************\n';

var platform = os.platform();
var CURRENT_DIR = process.cwd();

// Function to download and install node-informixdb
function InstallNodeInformixDB() {
    var readStream;
    var writeStream;
    var arch = os.arch();
    var fstream = require('fstream');
    var unzipper = require('unzipper');

    var CSDK_HOME, CSDK_INCLUDE, CSDK_LIB;

    if (process.env.CSDK_HOME || process.env.INFORMIXDIR) {

        if (process.env.CSDK_HOME) {
            CSDK_HOME = process.env.CSDK_HOME;

            console.log('\nFOUND: CSDK_HOME environment variable : ' + CSDK_HOME +
                '\nACTION: Build is in progress...\n');
        }
        else if (process.env.INFORMIXDIR) {
            CSDK_HOME = process.env.INFORMIXDIR;
            process.env.CSDK_HOME = CSDK_HOME.replace(/\s/g, '\\ ');

            console.log('\nFOUND: INFORMIXDIR environment variable : ' + CSDK_HOME +
                '\nACTION: Build is in progress...\n');
        }

        CSDK_INCLUDE = path.resolve(CSDK_HOME, 'incl/cli');
        CSDK_LIB = path.resolve(CSDK_HOME, 'lib');

        if (!fs.existsSync(CSDK_HOME)) {
            console.log('\n' + CSDK_HOME + ' directory does not exist. Please check if you have ' +
                'set the CSDK_HOME environment variable\'s value correctly.\n');
        }

        if (!fs.existsSync(CSDK_INCLUDE)) {
            console.log('\n' + CSDK_INCLUDE + ' directory does not exist. Please check if you have ' +
                'set the CSDK_HOME environment variable\'s value correctly.\n');
        }

        if (!fs.existsSync(CSDK_LIB)) {
            console.log('\n' + CSDK_LIB + ' directory does not exist. Please check if you have ' +
                'set the CSDK_HOME environment variable\'s value correctly.\n');
        }

        if (platform != 'win32') {
            if (!fs.existsSync(CSDK_HOME + "/lib"))
                fs.symlinkSync(CSDK_LIB, path.resolve(CSDK_HOME, 'lib'));

            if ((platform == 'linux') || (platform == 'aix') ||
                (platform == 'darwin' && arch == 'x64')) {
                removeWinBuildArchive();
                buildBinary();
            }
        }
        else if (platform == 'win32' && arch == 'x64') {
            buildBinary();
        }
        else {
            console.log('\nBuilding binaries for node-informixdb. This platform ' +
                'is not completely supported, you might encounter errors. ' +
                'In such cases please open an issue on our repository, ' +
                'https://github.com/OpenInformix/node-informixdb. \n');
        }
    }
    else {
        console.log('\nPlease install Informix Client SDK prior to installing node-informixdb ' +
            'and set the CSDK_HOME environment variable value to the Client SDK installation. \n');
        process.exit(1);
    }  // * END OF EXECUTION */

    function buildBinary(isDownloaded) {
        var buildString = "node-gyp configure build ";

        // Clean existing build directory
        removeDir('build');

        // Windows : Auto Installation Process -> 1) node-gyp then 2) msbuild.
        if (platform == 'win32' && arch == 'x64') {
            var buildString = buildString + " --CSDK_HOME=\$CSDK_HOME";

            var childProcess = exec(buildString, function (error, stdout, stderr) {
                console.log(stdout);

                if (error !== null) {
                    // "node-gyp" FAILED: RUN Pre-compiled Binary Installation process.
                    console.log(error);
                    console.log('\nERROR: node-gyp build process failed! \n' +
                        '\nACTION: Proceeding with Pre-compiled Binary Installation. \n');
                    installPreCompiledWinBinary();
                    return;
                } else {
                    console.log("\n" +
                        "===================================\n" +
                        "node-informixdb installed successfully!\n" +
                        "===================================\n");
                }
            });
        }
        else {
            var buildString = buildString + " --CSDK_HOME=\"$CSDK_HOME\"";
            var childProcess = exec(buildString, function (error, stdout, stderr) {
                console.log(stdout);
                if (error !== null) {
                    console.log(error);
                    process.exit(1);
                } else {
                    console.log("\n" +
                        "===================================\n" +
                        "node-informixdb installed successfully!\n" +
                        "===================================\n");
                }
            });
        }
    } //buildBinary

    function installPreCompiledWinBinary() {
        if (platform == 'win32') {
            if (arch == 'x64') {
                var BUILD_FILE = path.resolve(CURRENT_DIR, 'build.zip');

                //Windows node binary names should update here.
                var ODBC_BINDINGS = 'build\/Release\/odbc_bindings.node';
                var ODBC_BINDINGS_V8 = 'build\/Release\/odbc_bindings.node.8.16.0';
                var ODBC_BINDINGS_V9 = 'build\/Release\/odbc_bindings.node.9.11.2';
                var ODBC_BINDINGS_V10 = 'build\/Release\/odbc_bindings.node.10.16.0';

                // Windows add-on binary for node.js v0.10.x and v0.12.7 has been discontinued.
                if (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 8.0) {
                    console.log('\nERROR: Did not find precompiled add-on binary for node.js version ' + process.version + ':' +
                        '\ninformixdb does not provide precompiled add-on binary for node.js version ' + process.version +
                        ' on Windows platform. Visual Studio is required to compile informixdb with node.js versions < 8.X. ' +
                        'Otherwise please use the node.js version >= 8.X\n');
                    process.exit(1);
                }

                /*
                 * odbcBindingsNode will consist of the node binary-
                 * file name according to the node version in the system.
                 */
                var odbcBindingsNode = (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 9.0) && ODBC_BINDINGS_V8 ||
                    (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 10.0) && ODBC_BINDINGS_V9 ||
                    (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 11.0) && ODBC_BINDINGS_V10 || ODBC_BINDINGS;

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
                            "===================================\n" +
                            "node-informixdb installed successfully!\n" +
                            "===================================\n");
                    });

                return 1;

            } else {
                console.log('\nERROR: Windows 32 bit not supported. Please use an ' +
                    'x64 architecture.\n');
                process.exit(1);
            }
        }
    }

    function removeWinBuildArchive() {
        var WIN_BUILD_FILE = path.resolve(CURRENT_DIR, 'build.zip');
        fs.exists(WIN_BUILD_FILE, function (exists) {
            if (exists) {
                fs.unlinkSync(WIN_BUILD_FILE);
            }
        });
    }

    function removeDir(dir) {
        var fullPath = path.resolve(CURRENT_DIR, dir);
        if (fs.existsSync(fullPath)) {
            if (platform == 'win32') {
                execSync("rmdir /s /q " + '"' + fullPath + '"');
            } else {
                execSync("rm -rf " + '"' + fullPath + '"');
            }
        }
    }

}; //InstallNodeInformixDB

InstallNodeInformixDB();