export class Menu {
    constructor() {
      this.createMenu();
    }
  
    createMenu() {
      // Create an overlay div for the menu.
      const menuDiv = document.createElement('div');
      menuDiv.id = 'menu';
      menuDiv.style.position = 'absolute';
      menuDiv.style.top = '0';
      menuDiv.style.left = '0';
      menuDiv.style.width = '100%';
      menuDiv.style.height = '100%';
      menuDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      menuDiv.style.display = 'flex';
      menuDiv.style.flexDirection = 'column';
      menuDiv.style.justifyContent = 'center';
      menuDiv.style.alignItems = 'center';
      menuDiv.style.color = 'white';
      menuDiv.style.fontSize = '24px';
  
      // Title for character selection.
      const title = document.createElement('h1');
      title.innerText = 'Select Your Character';
      menuDiv.appendChild(title);
  
      // Character selection dropdown.
      const selectCharacter = document.createElement('select');
      selectCharacter.id = 'character-select';
      const characters = ['Human', 'Bear', 'Cheetah', 'Dragon']; // Example choices.
      characters.forEach(char => {
        const option = document.createElement('option');
        option.value = char;
        option.text = char;
        selectCharacter.appendChild(option);
      });
      menuDiv.appendChild(selectCharacter);
  
      // Opponent selection dropdown.
      const selectOpponent = document.createElement('select');
      selectOpponent.id = 'opponent-select';

      const opponents = ['Bear', 'Cheetah', 'Dragon']; // Example choices.
      opponents.forEach(opponent => {
        const option = document.createElement('option');
        option.value = opponent;
        option.text = opponent;
        selectOpponent.appendChild(option);
      });
      menuDiv.appendChild(selectOpponent);
  
      // Start battle button.
      const startButton = document.createElement('button');
      startButton.innerText = 'Start Battle';
      startButton.addEventListener('click', () => {
        // On click, remove the menu overlay.
        menuDiv.style.display = 'none';
        const event = new CustomEvent('startBattle');
        document.dispatchEvent(event);
        // Future logic: dispatch selection events or update game state.
      });
      menuDiv.appendChild(startButton);
  
      document.body.appendChild(menuDiv);
    }
  }
  