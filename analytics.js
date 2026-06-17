(function(){
  var p=location.pathname+location.hash||'/';
  var r=document.referrer||'';
  var d=document;
  try{
    var x=new XMLHttpRequest();
    x.open('POST','/api/hit',true);
    x.setRequestHeader('Content-Type','application/json');
    x.send(JSON.stringify({p:p,r:r}));
  }catch(e){}
})();
