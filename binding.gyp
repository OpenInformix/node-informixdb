{
  'targets' : [
    {
      'target_name' : 'odbc_bindings',
      'sources' : [
        'src/odbc.cpp',
        'src/odbc_connection.cpp',
        'src/odbc_statement.cpp',
        'src/odbc_result.cpp',
      ],

      'include_dirs' : [
        "<!(node -e \"require('nan')\")"
      ],

      'defines' :
      [
        #'UNICODE',
        'ODBC64'
      ],

      "variables" : {
        # Set the linker location
        "ORIGIN_LIB_PATH%" : "$(CSDK_HOME)/lib/cli",
      },

      'conditions' : [
        [ '(OS == "linux" and (target_arch =="ia32" or target_arch == "s390" or target_arch == "ppc32" or target_arch == "arm")) or (OS == "aix" and target_arch == "ppc")',
          { 
            'conditions' : [],  
            'libraries' : 
            [ 
              '-L$(CSDK_HOME)/lib/cli',
              '-lthcli' 
            ],
            'include_dirs' : 
            [
              '$(CSDK_HOME)/incl/cli'
            ],
            'cflags' : ['-g'],
          }
        ],

        [ '(OS == "linux" or OS == "aix") and (target_arch =="x64"  or target_arch == "s390x" or target_arch == "ppc64")',
          { 
            'conditions' : [],    
            'libraries' :
            [
              '-L$(CSDK_HOME)/lib/cli ',
              '-lthcli' 
            ],
            'include_dirs' :
            [
              '$(CSDK_HOME)/incl/cli'
            ],
            'cflags' : ['-g -m64'],
          }
        ],

        [ 'OS == "mac" and target_arch =="x64" ',
          { 'xcode_settings' : {'GCC_ENABLE_CPP_EXCEPTIONS': 'YES' },
            'libraries' :
            [
              '-L$(CSDK_HOME)/lib/cli',
              '-lthcli'
            ],
            'include_dirs' :
            [
              '$(CSDK_HOME)/incl/cli'
            ],
            'cflags' : ['-g']
          }
        ],

        [ 'OS=="win" and target_arch =="ia32"',
          { 'sources' : ['src/strptime.c', 'src/odbc.cpp'],
            'libraries' :
            [
              '$(CSDK_HOME)/lib/iclit09b.lib'
            ],
            'include_dirs' :
            [
              '$(CSDK_HOME)/incl/cli',
              '$(NODE_SRC)/test/gc/node_modules/nan'
            ]
          }
        ],

        [ 'OS=="win" and target_arch =="x64"',
          { 'sources' : ['src/strptime.c', 'src/odbc.cpp'],
            'libraries' :
            [
              '$(CSDK_HOME)/lib/iclit09b.lib'
            ],
            'include_dirs' :
            [
              '$(CSDK_HOME)/incl/cli',
              '$(NODE_SRC)/test/gc/node_modules/nan'
            ]
          }
        ],

        [ 'OS != "linux" and OS!="win" and OS!="darwin" and target_arch =="ia32" ',
          { 'conditions' : [],
            'libraries' :
            [
              '-L$(CSDK_HOME)/lib/cli',
              '-lthcli'
            ],
            'include_dirs' :
            [
              '$(CSDK_HOME)/incl/cli'
            ],
            'cflags' : ['-g']
          }
        ], 

        [ 'OS != "linux" and OS != "win" and OS != "mac" and target_arch == "x64" ',
          { 'conditions' : [],    
            'libraries' :
            [
              '-L$(CSDK_HOME)/lib/cli',
              '-lthcli'
            ],
            'include_dirs' :
            [
              '$(CSDK_HOME)/incl/cli'
            ],
            'cflags' : ['-g']
          }
        ]

      ]
    }
  ]
}