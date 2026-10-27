/**
 * Help mode tour steps for FlatmapVuer.
 * `id` matches the `data-help-id` attribute of the target element.
 * `area` is one of the `HELP_MODE_AREAS` keys from `@abi-software/map-utilities`.
 * `hover: false` steps are not shown in the hover help, they need `onEnter` to be visible.
 * `inDrawer` steps are inside the pathway drawer, which is opened before showing them.
 */
const flatmapHelpModeSteps = [
  {
    id: 'map-popup',
    area: 'map-info',
    hover: false,
    title: 'Explore the map',
    description:
      'Hover over a feature on the map to see its name, click on it to see more information such as its connectivity.',
    placement: 'bottom',
  },
  {
    id: 'warning',
    area: 'map-info',
    title: 'About this map',
    placement: 'right',
  },
  {
    id: 'whats-new',
    area: 'map-info',
    title: "What's new?",
    description: 'See the latest changes and improvements made to this map.',
    placement: 'right',
  },
  {
    id: 'pathways',
    area: 'legends',
    title: 'Pathways and legends',
    description:
      'Show or hide pathways, systems and other map layers using the checkboxes in this panel.',
    placement: 'right',
    inDrawer: true,
  },
  {
    id: 'marker',
    area: 'legends',
    hover: false,
    title: 'Dataset markers',
    description:
      'Find these markers on the map for data. The number inside a marker is the number of datasets available at that location.',
    placement: 'right',
    inDrawer: true,
  },
  {
    id: 'featured-marker',
    area: 'legends',
    title: 'Featured dataset marker',
    description: 'Shows the location of the featured dataset on the map.',
    placement: 'right',
    inDrawer: true,
  },
  {
    id: 'zoom-in',
    area: 'zoom',
    title: 'Zoom in',
    description: 'Zoom in to see more detail. You can also scroll or pinch on the map.',
    placement: 'left',
  },
  {
    id: 'zoom-out',
    area: 'zoom',
    title: 'Zoom out',
    description: 'Zoom out to see more of the map.',
    placement: 'top',
  },
  {
    id: 'zoom-fit',
    area: 'zoom',
    title: 'Fit to window',
    description: 'Reset the view so the whole map fits in the window.',
    placement: 'top',
  },
  {
    id: 'open-map',
    area: 'map-settings',
    title: 'Open new map',
    description: 'Open another map, such as a different species or a connectivity map.',
    placement: 'right',
  },
  {
    id: 'settings',
    area: 'map-settings',
    title: 'Settings',
    description: 'Change the map settings, such as the background colour and the viewing mode.',
    placement: 'right',
  },
  {
    id: 'draw-edit',
    area: 'drawing',
    title: 'Edit mode',
    description: 'Select a drawn feature to edit it or add a comment.',
    placement: 'top',
  },
  {
    id: 'draw-delete',
    area: 'drawing',
    title: 'Delete mode',
    description: 'Select a drawn feature to delete it.',
    placement: 'top',
  },
  {
    id: 'draw-point',
    area: 'drawing',
    title: 'Draw point',
    description: 'Draw a point on the map to annotate a location.',
    placement: 'top',
  },
  {
    id: 'draw-line-string',
    area: 'drawing',
    title: 'Draw line',
    description: 'Draw a line on the map, for example to annotate a new connection.',
    placement: 'top',
  },
  {
    id: 'draw-polygon',
    area: 'drawing',
    title: 'Draw polygon',
    description: 'Draw a polygon on the map to annotate an area.',
    placement: 'top',
  },
  {
    id: 'draw-connection',
    area: 'drawing',
    title: 'Connection',
    description: 'Link the drawn feature with existing features on the map.',
    placement: 'top',
  },
];

const flatmapWarningDescriptions = {
  legacy: 'This is a legacy map. Click the link below the icon to view the latest map instead.',
  fc: 'This map displays the connectivity of individual neurons which align with the neuron populations from the ApiNATOMY models available in SCKAN.',
  default:
    'This map displays the connectivity of neuron populations from the primarily rat-based ApiNATOMY models available in SCKAN. New connectivity and species specificity will be added as the SPARC program progresses.',
};

export { flatmapHelpModeSteps, flatmapWarningDescriptions };
