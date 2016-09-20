var dockerhttp = require("../lib/dockerhttp.js");
var filesystem = require("../lib/filesystem.js");
var jsonfile = require("jsonfile");
var langs = require("../lib/langs.js");
var cuid = require("cuid");
var fs = require("fs");
var eval = require("../lib/eval.js")
var exec = require("child_process").exec;
var container = require("../lib/container.js");

var Sandbox = {
    create: function(req, res, callback) {
        req.body.dirname = cuid();

        var config = req.body
        config.image = "coderunner"
        config.volume = "/codetree/tempDir"
        config.binds = ["/home/abdullahimahamed0987/sandbox/temp/" + config.dirname + ":/codetree/tempDir:rw"]
        config.commands = ['/bin/bash']

        dockerContainer.createTemps(req.body, function(err) {
            if (err) return callback(err)

            createContainer(config,function(err, containerId) {
                if (err) return callback(err);

                req.body.containerId = containerId;

                return callback();
            })
        })
    },
    runCode:function(req,res,callback){
        updateCode(req.body.dirname,req,function(err){
            if(err) return callback(err)

            containerExec(req.body.containerId,function(err){
                if(err) return callback(err)

                return callback();
            })
        })
    },
    checkCode:function(req,res,callback){
      done = false;

      fs.readFile("temp/"+req.body.dirname+"/compileout.txt","utf8", function(err,data) {
          if (err) {
            return;
          }
          else{

            exec("rm temp/"+req.body.dirname+"/compileout.txt",function(err,stdout,stderr){
              if(err)
                res.status(500).send(stderr)

              res.status(500).send(data);
            })

          }
      });


      fs.access("temp/"+req.body.dirname+"/completed.txt", fs.F_OK, function(err) {
          if (err) {
              return;
          }
          else{
            evalute(req.body.dirname,{
              input:req.body.input,
              expectedOutput:req.body.output
            },function(err,result){

              if(err){
                res.status(500).send(err);
              }

              exec("rm temp/"+req.body.dirname+"/completed.txt",function(err,stdout,stderr){
                if(err)
                  res.status(500).send(stderr)

                req.body.result = result;
                res.json(req.body);
              })

            })

          }
      });

    },
    remove:function(req,res,callback){
        dockerhttp.post("/containers/"+req.body.containerId+"/stop",{},function(err){
            if(err) return callback(err)

            dockerhttp.delete("/containers/"+req.body.containerId+"?v=1",{},function(err){
                if(err) return callback(err)

                return callback();
            })
        })
    }
}

function evalute(dirname,data,callback){
  eval.checkFiles("temp/"+dirname+"/src/output",data.expectedOutput,function(err,result){
    if(err) return callback(err);

    return callback(null,result);
  })
}


module.exports = Sandbox;