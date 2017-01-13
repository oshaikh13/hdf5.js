var F = null;

window.onload = function() {
  
  // init DnD
  document.getElementById("body").addEventListener("dragover", onDragOver, false);
  document.getElementById("body").addEventListener("dragleave", onDragLeave, false);
  document.getElementById("body").addEventListener("drop", onDrop, false);

};

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

  F = new HDF5.File(files[0]);

};
