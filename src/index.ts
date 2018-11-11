import ByTabs from './ByTabs.js';
import PanelList from './PanelList.js';

const components: any = {
  ByTabs,
  PanelList
};

// Temporary component loader
export default (c: string[]): void => {
  for (const component of c) {
    if (component in components) components[component]();
  }
};
