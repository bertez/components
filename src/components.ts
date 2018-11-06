interface IPanelListDef {
  text?: string;
  children: IPanelListDef[];
}

class PanelList extends HTMLUListElement {
  ast: IPanelListDef[];
  stack: IPanelListDef[][];
  constructor() {
    super();

    this.ast = PanelList.createULAST(this);
    this.stack = [];

    const style = document.createElement('style');

    style.textContent = `
      .has-children {
        font-weight: bold;
        cursor: pointer;
      }
    `;

    this.parentElement.appendChild(style);

    this.clearList();
    this.classList.add('panel-list');
    this.setPanel(this.ast);
  }

  clearList = () => {
    //Remove al ul children
    while (this.firstChild) {
      this.firstChild.remove();
    }
  };

  getStackLastElement = () => {
    return this.stack[this.stack.length - 1];
  };

  setPanel = (root: IPanelListDef[], stack: boolean = true) => {
    stack && this.stack.push(root);
    this.clearList();

    for (const item of root) {
      const panelItem = document.createElement('li');
      panelItem.innerText = item.text || '';

      if (item.children.length) {
        panelItem.classList.add('has-children');
        panelItem.onclick = () => this.setPanel(item.children);
      }

      this.appendChild(panelItem);
    }

    if (this.stack.length > 1) {
      const back = document.createElement('button');
      back.innerText = '<';

      back.onclick = () => {
        this.stack.pop();
        this.setPanel(this.getStackLastElement(), false);
      };

      this.appendChild(back);
    }

    console.log(this.stack);
  };

  static createULAST = (node: HTMLUListElement) => {
    const items = node.querySelectorAll(':scope > li');

    return Array.from(items)
      .filter(item => item.childNodes.length > 0)
      .map(item => {
        const def: IPanelListDef = { children: [] };

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

        if (subitem) def.children = PanelList.createULAST(subitem);

        return def;
      });
  };
}

export { PanelList };
