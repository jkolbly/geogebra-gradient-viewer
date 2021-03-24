var PARAMS = {"width": 800, "height": 600, "showToolBar": false, "showAlgebraInput": false, "showMenuBar": false, "filename": "contourmaps.ggb", "showLogging": false, "useBrowserForJS": true};

var VALIDKEYS = ["f", "Latticestart", "interval", "offset", "num", "latticeradius", "latticeincrement"];

var ggbApplet = new GGBApplet(PARAMS, true);

window.addEventListener("load", function() { 
    ggbApplet.inject('ggb-element');
});

var uri = new URI(document.URL);
var $_GET = uri.query(true);

function ggbOnInit() {
  for (let key in $_GET)
  {
    if (VALIDKEYS.includes(key)) {
      ggbApplet.evalCommand(`SetValue[${key}, ${$_GET[key]}]`);
    }
  }
  updateURL();

  createContours();
  ggbApplet.registerObjectUpdateListener("num", "createContours");

  createLattice();
  ggbApplet.registerObjectUpdateListener("latticeradius", "createLattice");

  // Hacks to fix stuff in the .ggb file
  ggbApplet.evalCommand("SetPerspective(\"G\")");
  ggbApplet.evalCommand(`${vectorName(0, 0)}=Vector(Latticestart, Latticestart + N(Latticestart))`);

  ggbApplet.registerUpdateListener("updateURL");
}

var replaceStateTimer;
var canReplaceBrowserState = true;
var replaceBrowserStateWhenPossible = false;

function updateURL(key="") {
  if (VALIDKEYS.includes(key))
  {
    uri.setSearch(key, ggbApplet.getValueString(key).split("=", 2)[1]);
  }

  document.getElementById("url").value = uri.toString();

  if (canReplaceBrowserState)
  {
    replaceBrowserState();
  } else {
    replaceBrowserStateWhenPossible = true;
  }
}

function enableReplaceBrowserState() {
  canReplaceBrowserState = true;

  if (replaceBrowserStateWhenPossible) {
    replaceBrowserState();
  }
}

function replaceBrowserState() {
  window.history.replaceState({"uri": uri}, document.title, uri.toString());

  canReplaceBrowserState = false;
  replaceBrowserStateWhenPossible = false;

  replaceStateTimer = setTimeout(enableReplaceBrowserState, 500);
}

var contourNum = 0;

function createContours() {
  let oldnum = contourNum;
  contourNum = getValueSafe("num");

  for (let i = contourNum; i < oldnum; i++)
  {
    ggbApplet.deleteObject("c" + i);
  }

  for (let i = oldnum; i < contourNum; i++) {
    ggbApplet.evalCommand("c" + i + "=ImplicitCurve(f(x,y)-offset-interval*" + (i - 1) + ")");
    ggbApplet.setLabelVisible("c" + i, false);
  }

}


var latticeRadius = 0;

function createLattice()
{
  let oldnum = latticeRadius;
  latticeRadius = getValueSafe("latticeradius");

  let max = Math.max(oldnum, latticeRadius);
  for (let x = -max; x <= max; x++)
  {
    for (let y = -max; y <= max; y++)
    {
      if (Math.abs(x) > latticeRadius || Math.abs(y) > latticeRadius)
      {
        ggbApplet.deleteObject(pointName(x, y));
        ggbApplet.deleteObject(vectorName(x, y));
      } else if (Math.abs(x) > oldnum || Math.abs(y) > oldnum)
      {
        ggbApplet.evalCommand(`${pointName(x, y)}=(${x},${y})*latticeincrement + Latticestart`);

        ggbApplet.evalCommand(`${vectorName(x, y)}=Vector(${pointName(x, y)}, ${pointName(x, y)} + N(${pointName(x, y)}))`);

        ggbApplet.setLabelVisible(pointName(x, y), false);
        ggbApplet.setLabelVisible(vectorName(x, y), false);
      }
    }
  }
}

function pointName(x, y)
{
  let newX = x < 0 ? "_" + (-x) : x;
  let newY = y < 0 ? "_" + (-y) : y;

  return "P" + newX + "x" + newY;
}

function vectorName(x, y)
{
  return "v" + pointName(x, y);
}

function getValueSafe(name)
{
  return ggbApplet.exists(name) ? ggbApplet.getValue(name) : 0;
}