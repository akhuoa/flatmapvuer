# FlatmapVuer

View the a live demo and documentation at: https://abi-software.github.io/flatmapvuer/

This project aims to wrap the flatmap viewer project into a vue component.
There are currently two components available. FlatmapVuer and MultiFlatmapVuer. FlatmapVuer is used for displaying a single flatmap whereas MultiFlatmapVuer takes in an array of flatmaps and provide a chooser for selecting the flatmap on display.

This project is now built with Vue3 frameworks, Vue 2 version of Flatmapvuer is no longer maintained.

## Flatmapvuer on NPM

Flatmapvuer is available on npm and can be installed into your project with the following command:
```bash
npm i @abi-software/flatmapvuer
```

## How to use
Install the package "npm i @abi-software/flatmapvuer" to your vue app.
Include the package in your script.
```javascript
import {FlatmapVuer, MultiFlatmapVuer} from '@abi-software/flatmapvuer';
import '@abi-software/flatmapvuer/dist/style.css';
```
Local registration in vue component:
```javascript
export default {
  ...
  components: {
    FlatmapVuer,
    MultiFlatmapVuer
  }
  ...
}
```

The line above registers both the FlatmapVuer and MultiFlatmapVuer component into the global scope.
You can now use the FlatmapVuer in your vue template as followed:
```html
<FlatmapVuer entry="NCBITaxon:9606" uuid="uuid-to-set" v-on:resource-selected="FlatmapSelected"  v-on:ready="FlatmapReady"/>
```

**entry** is the variable/string with the NCBI Taxonomy term. Some of the available taxon including: NCBITaxon:9606 (Human), NCBITaxon:9685 (Cat), NCBITaxon:9823 (Pig), NCBITaxon:10090 (Mouse) and NCBITaxon:10114 (Rat). This will always get the latest version of a map with the matching taxon.

**uuid** is the unique id of a specific map. This will be used instead of **entry** when specified.

**ready** is the custom event when the map has been loaded successfully.
**resource-selected** is the custom event triggered when a part of the flatmap is selected, the returned argument **resource** provides information of the selected resource. Information of location is provided with supported maps in the **feature -> location** property.

Markers must be added to make a label selectable and it can be done through the **addMarker** method on the mapImp member of the FlatmapVuer component.

Please see the following sample codes for details.

```javascript
  methods: {
    FlatmapSelected: function(resource) {
     console.log(resource);
    },
    FlatmapReady: function(flatmapComponent) {
      labels = flatmapComponent.getLabels(); //return list of labels
      //The following line adds a marker on the map. UBERON:0000948
      //is the UBERON id representing the heart.
      flatmapComponent.mapImp.addMarker("UBERON:0000948", "simulation");
    }
  }
```

You can also use MultiFlatmapVuer to provide a selection of flatmaps.
```html
<MultiFlatmapVuer :availableSpecies="availableSpecies"
  @resource-selected="FlatmapSelected"
  @ready="FlatmapReady" :initial="initial"/>
```
**availableSpecies** is the object containing information of available species for the users. See below for an example:
```javascript
  availableSpecies : {
    "Human":{taxo: "NCBITaxon:9606", iconClass:"icon-mapicon_human"},
    "Rat":{taxo: "NCBITaxon:10114", iconClass:"icon-mapicon_rat"},
    "Mouse":{taxo: "NCBITaxon:10090", iconClass:"icon-mapicon_mouse"},
    "Pig":{taxo: "NCBITaxon:9823", iconClass:"icon-mapicon_pig"},
    "Cat":{taxo: "NCBITaxon:9685", iconClass:"icon-mapicon_cat"},
  }
```
The keys of the codes above provide the labels on the chooser, **taxo** should be one of the available taxon id from the list and **iconClass** specifies the user provided icons to use.

**initial** specifies the start up species when the component is first mounted, it should be one of the keys on the provided available species.


## Project setup from Github

The source code is available from Github, it can be found here: https://github.com/ABI-Software/flatmapvuer .

### Clone the respositroy
```bash
git clone https://github.com/ABI-Software/flatmapvuer.git
```

### Setup
```bash
npm install
```

### Compiles and minifies for production
```bash
npm run build-bundle
```

### Run the sample application
```bash
npm run serve
```


## Documentation

The documentation is developed with `vitepress` and `vuese`. Documentation pages are in the `docs` folder.

### To run in local development mode
```bash
npm run docs:watch
```
This will start the documentation server with `vitepress` on port `:5173` and watch the `FlatmapVuer` and `MultiFlatmapVuer` components changes.
