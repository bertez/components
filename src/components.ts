interface IPanelListDef {
  text: Node;
  children: IPanelListDef[];
}

class PanelList extends HTMLUListElement {
  tree: IPanelListDef[];
  stack: IPanelListDef[][];
  constructor() {
    super();

    this.tree = PanelList.createULTree(this);
    this.stack = [];

    this.clearList();
    this.forwardPanel(this.tree);
    this.classList.add('is-ready');
  }

  get lastPanel(): IPanelListDef[] {
    return this.stack[this.stack.length - 1];
  }

  static createULTree = (node: Node) => {
    const isValid = (node: Node) =>
      node.nodeName === 'LI' &&
      node.childNodes.length > 0 &&
      ['#text', 'A'].includes(node.childNodes[0].nodeName);

    return Array.from(node.childNodes)
      .filter(isValid)
      .map(item => {
        const [text, children] = Array.from(item.childNodes);

        const def: IPanelListDef = {
          text,
          children: children ? PanelList.createULTree(children) : []
        };

        return def;
      });
  };

  private clearList = () => {
    while (this.firstChild) {
      this.firstChild.remove();
    }
  };

  private getStackLastElement = () => {
    return this.stack[this.stack.length - 1];
  };

  private setPanel = (root: IPanelListDef[]) => {
    this.clearList();

    if (this.stack.length > 1) {
      const navItem = document.createElement('li');
      navItem.classList.add('is-navigation');

      const back = document.createElement('button');
      back.innerText = this.getAttribute('data-back') || '<';

      back.onclick = () => this.backwardPanel();

      navItem.appendChild(back);
      this.appendChild(navItem);
    }

    for (const item of root) {
      const panelItem = document.createElement('li');
      panelItem.appendChild(item.text);

      if (item.children.length) {
        panelItem.classList.add('has-children');
        panelItem.onclick = () => this.forwardPanel(item.children);
      } else {
        panelItem.classList.add('is-terminal');
      }

      this.appendChild(panelItem);
    }
  };

  forwardPanel = (root: IPanelListDef[]) => {
    this.stack.push(root);
    this.setPanel(root);
  };

  backwardPanel = () => {
    this.stack.pop();
    this.setPanel(this.lastPanel);
  };
}

export { PanelList };
