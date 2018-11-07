interface IPanelListDef {
  text: string;
  children: IPanelListDef[];
}

class PanelList extends HTMLUListElement {
  tree: IPanelListDef[];
  stack: IPanelListDef[][];
  constructor() {
    super();

    this.tree = PanelList.createULTree(this);
    this.stack = [];

    const style = document.createElement('style');

    style.textContent = `
      .has-children {
        font-weight: bold;
        cursor: pointer;
      }

      .is-navigation {
        list-style: none;
      }
      
      .is-terminal {
        color: blue;
        text-decoration: underline;
        cursor: pointer;
      }
    `;

    this.parentElement && this.parentElement.appendChild(style);

    this.clearList();
    this.classList.add('panel-list');
    this.forwardPanel(this.tree);
  }

  get lastPanel(): IPanelListDef[] {
    return this.stack[this.stack.length - 1];
  }

  static createULTree = (node: HTMLUListElement) => {
    const items = node.querySelectorAll(':scope > li');

    return Array.from(items)
      .filter(item => item.childNodes.length > 0)
      .map(item => {
        const def: IPanelListDef = { text: 'Node', children: [] };

        const firstNode = item.childNodes[0];
        const firstNodeText = firstNode.textContent;

        if (
          firstNodeText &&
          firstNode.nodeType === 3 &&
          firstNodeText.trim().length
        ) {
          def.text = firstNodeText.trim();
        }

        const subitem = <HTMLUListElement>item.querySelector(':scope > ul');

        if (subitem) def.children = PanelList.createULTree(subitem);

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
      back.innerText = '<';

      back.onclick = () => this.backwardPanel();

      navItem.appendChild(back);
      this.appendChild(navItem);
    }

    for (const item of root) {
      const panelItem = document.createElement('li');
      panelItem.innerText = item.text;

      if (item.children.length) {
        panelItem.classList.add('has-children');
        panelItem.innerText = panelItem.innerText + ' >';
        panelItem.onclick = () => this.forwardPanel(item.children);
      } else {
        panelItem.classList.add('is-terminal');
        panelItem.onclick = () => alert(item.text);
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
