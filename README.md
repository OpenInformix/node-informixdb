# Informix native node.js driver - node-informixdb:
Informix native node.js driver is a high performance driver with asynchronous/synchronous interface suitable for highly scalable enterprise applications and lightweight enough for Internet of things (IoT) solutions working with Informix database.

**Supported Platforms** - Windows64, Linuxx64, Linuxia32, AIX.

## Supported Node.js Versions

**Recommended version of node.js is >= V10.X**

| Node.js Version   | Windows 64        | Linux x64         | MacOS             | AIX                |
| :---:             | :---:             | :---:             | :---:             | :---:              |
| < V8.X            | NO (DISCONTINUED) | NO (DISCONTINUED) | NO (DISCONTINUED) | NO (DISCONTINUED)  |
|   V8.X            | NO (DISCONTINUED) | NO (DISCONTINUED) | NO (DISCONTINUED) | NO (DISCONTINUED)  |
|   V9.X            | NO (DISCONTINUED) | NO (DISCONTINUED) | NO (DISCONTINUED) | NO (DISCONTINUED)  |
|   V10.X           | YES               | YES               | NO                | YES                |
|   V11.X           | YES               | YES               | NO                | YES                |
|   V12.X           | YES               | YES               | NO                | YES                |
|   V13.X           | YES               | YES               | NO                | YES                |
|   V14.X           | YES               | YES               | NO                | YES                |
| > V14.X           | FUTURE            | FUTURE            | FUTURE            | FUTURE             |

**The latest node.js version using which informixdb is tested: 14.9.0**

## Prerequisite

- Python 2.7 is required by node-gyp.

- Informix ODBC (It will get download automatically while installation, if CSDK_HOME/INFORMIXDIR is not set.)

- If Windows Platform: for compilation of informixdb Visual Studio is required, if not available then module will install with "pre-compiled" binary version.

- If Linux Platform: for compilation of informixdb C++11 compiler is required, if not available then module will install with "pre-compiled" binary version.
  (Note the default compiler on RHEL 6 does not have the required support. Install a newer compiler or upgrade the older one.)

### Important Environment Variables and Download Essentials
** To use exiting CSDK installation directory set below env variables, it will prevent automatic download of Informix ODBC driver **

`CSDK_HOME:`

- USE:
	- On distributed platforms, set this environment variable if you want to compile/build the informixdb module.

- HOW:
	- Set **CSDK_HOME** environment variable to a pre-installed **Informix CSDK installation directory**.

`INFORMIXDIR:`

- USE:
	- On distributed platforms, set this environment variable if you want to compile/build the informixdb module.

- HOW:
	- Set **INFORMIXDIR** environment variable to a pre-installed **Informix CSDK installation directory**.

`CSDK_INSTALLER_URL :`

- USE:
	- Set this environment variable to by-pass the HCL Hosted URL for downloading odbc driver.

- HOW:
	- Set **CSDK_INSTALLER_URL** environment variable with alternate odbc/driver downloading URL link or with locally downloaded "tar/zipped driver's parent directory path.

- TIP:
	- If you don't have alternate hosting URL then, you can download the tar/zipped file of driver from the [HCL Hosted URL](#downloadODBC) and can set the **CSDK_INSTALLER_URL** environment variable to the downloaded "tar/zipped driver's" parent directory path. No need to untar/unzip the driver and do not change the name of downloaded file.

### <a name="downloadODBC"></a> Download onedb-odbc-driver ([based on your platform & architecture](#systemDetails)) from the below HCL Hosted URL:
> [DOWNLOAD ODBC DRIVER](https://hcl-onedb.github.io/odbc/)

#### <a name="systemDetails"></a> Informix ODBC Drivers for Specific Platform and Architecture

|Platform      |Architecture    |ODBC Driver                       |Supported     |
| :---:        |  :---:         |  :---:                           |  :---:       |
|Linux         |  x64           |OneDB-Linux64-ODBC-Driver.tar.gz  |  Yes         |
|Windows       |  x64           |OneDB-Win64-ODBC-Driver.zip       |  Yes         |


## Install

You may install the package using npm install command:

```
npm install informixdb
```

or, you can install the latest driver from Github (Not recommanded for production use):

```
npm install git+https://github.com/OpenInformix/node-informixdb.git
```

> [For more installation details please refer:  INSTALLATION GUIDE](https://github.com/OpenInformix/node-informixdb/blob/master/INSTALL.md)

## API Documentation

> [For complete list of informixdb APIs and example, please check API DOCUMENTATION](https://github.com/OpenInformix/node-informixdb/blob/master/APIDocumentation.md)

## Quick Example

```javascript
var informix = require('informixdb');

informix.open("SERVER=dbServerName;DATABASE=dbName;HOST=hostName;SERVICE=port;UID=userID;PWD=password;", function (err,conn) {
  if (err) return console.log(err);
  
  conn.query('select 1 from table(set{1})', function (err, data) {
    if (err) console.log(err);
    else console.log(data);

    conn.close(function () {
      console.log('done');
    });
  });
});
```

## How to get an informixdb instance?

The simple api is based on the instances of `Database` class. You may get an 
instance by one of the following ways:

```javascript
require("informixdb").open(connectionString, function (err, conn){
  //conn is already open now if err is falsy
});
```

or by using the helper function:

```javascript
var informix = require("informixdb")();
``` 

or by creating an instance with the constructor function:

```javascript
var Database = require("informixdb").Database
  , informix = new Database();
```

## Debug

If you would like to enable debugging messages to be displayed you can add the 
flag `DEBUG` to the defines section of the `binding.gyp` file and then execute 
`node-gyp rebuild`.

```javascript
<snip>
'defines' : [
  "DEBUG"
],
<snip>
```

## Un-Install

To uninstall informixdb from your system, just delete the node-informixdb or informixdb directory.


## For AIX install issue

If `npm install informixdb` aborts with "Out Of Memory" error on AIX, first run `ulimit -d unlimited` and then `npm install informixdb`.


## Need Help?

The development activities of the driver are powered by passion, dedication and independent thinking. You may send pull request, together we grow as an open community. Relevant discussion and queries are answered by community through Stack Overflow. 
http://stackoverflow.com/questions/tagged/informix
   
If no solution found, you can open a new issue on GitHub.


## Contributors

* Rohit Pandey (rht.uimworld@gmail.com)
* Anjali Pancholi
* Sathyanesh Krishnan (msatyan@gmail.com)
* Javier Sagrera
* Dan VerWeire (dverweire@gmail.com)
* Lee Smith (notwink@gmail.com)
* IBM

## Contributing to the informixdb

[Contribution Guidelines](https://github.com/OpenInformix/node-informixdb/blob/master/Contribution.md)

```
Contributor should add a reference to the DC sign-off as comment in the pull request(example below):
DC Signed-off-by: Random J Developer <random@developer.org>
```

## License

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
