# Echarts TS Describer

Helps generate huge amount of ts definitions for echarts.

---

It was developed to generate doc for echarts.series but it can be used for any other options field.
As echarts is huge it is preferred to use it partially for specific options field.

## How to retrieve echarts doc data (for Chrome):
1. Go to echarts options doc https://ecomfe.github.io/echarts-doc/public/en/option.html
2. Go to dev tools and open `main.js?<some hash>`
3. Press "Pretty print" and look for a line like this:
```js
f.isFrozen() || f._toggleSingleItem(f._findItemEl(i(this)))
```
, it should be placed inside of `_initMouse` function.
4. Set debugger on this line
5. Click expand button on UI options sidebar (debugger should stop on this line)
6. Enter to console (to observe whole data):
```js
f._dataItemMap.root
```
7. Execute something like this (to be able copy this data to clipboard):
```js
f._dataItemMap.root.clean = function(item) {
    const itemForClean = item || this;

    delete itemForClean.parent;

    if (!itemForClean.children) {
        return;
    }

    itemForClean.children.forEach(item => {
        delete item.parent;

        if (item.children) {
            this.clean(item);
        }
    });
};
f._dataItemMap.root.clean();
```
Note: you can remove any redundant fields (as most of them are auxiliary)

8. Now you can copy any child from `root.children`, e.g.:
```js
copy(f._dataItemMap.root.children[24]);
```

Now Chrome should copy this object to clipboard and you can put it into `json` file.
