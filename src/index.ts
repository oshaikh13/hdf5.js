import HDF5 from './highLevel';

var F = null;

document.addEventListener("DOMContentLoaded", function(event) { 
  // init dnd
  document.getElementById("body").addEventListener("dragover", onDragOver, false);
  document.getElementById("body").addEventListener("dragleave", onDragLeave, false);
  document.getElementById("body").addEventListener("drop", onDrop, false);
});  



function onDragOver(e) {
  e.preventDefault();
};

function onDragLeave(e) {
  e.preventDefault();
};

function onDrop(e) {

  e.stopPropagation();
  e.preventDefault();

  // get the dropped files
  var files = e.dataTransfer.files;
  // if anything is wrong with the dropped files, exit
  if (typeof files == "undefined" || files.length == 0) {
    return;
  }

  F = new HDF5(files[0], () => {
    F.get("somedata", (wrapperArray) => {
      console.log(wrapperArray);
      const shape = wrapperArray.shape;
      for (var i = 0; i < shape[0]; i++) {
        for (var j = 0; j < shape[1]; j++) {
          wrapperArray.get(i, j, (x) => { console.log(x) });
        }
      }
    });
  });

};
