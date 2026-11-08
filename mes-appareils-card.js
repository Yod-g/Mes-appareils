class MesAppareilsCard extends HTMLElement {
  set hass(hass) {
    if (!this.content) {
      this.innerHTML = `
        <ha-card header="Mes Appareils & Maison">
          <div class="card-content" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; padding: 12px;">
            <div id="cards-container">Chargement des équipements...</div>
          </div>
        </ha-card>
      `;
      this.content = this.querySelector('#cards-container');
    }

    // Liste de tes équipements avec leur entité associée et leur type d'animation/icône
    const devices = [
      { name: "Lave-linge", entity: "sensor.lave_linge_power", type: "washing_machine" },
      { name: "Sèche-linge", entity: "sensor.seche_linge_power", type: "tumble_dryer" },
      { name: "Lave-vaisselle", entity: "sensor.lave_vaisselle_power", type: "dishwasher" },
      { name: "Congélateur", entity: "sensor.congelateur_power", type: "freezer" },
      { name: "Frigo", entity: "sensor.frigo_power", type: "fridge" },
      { name: "Four", entity: "sensor.four_power", type: "oven" },
      { name: "Micro-ondes", entity: "sensor.micro_ondes_power", type: "microwave" },
      { name: "Imprimante 3D", entity: "sensor.imprimante_3d_power", type: "printer_3d" },
      { name: "Baie Homelab", entity: "sensor.baie_homelab_power", type: "homelab" },
      { name: "Compteur Linky", entity: "sensor.linky_puissance_apparente", type: "electricity_meter" }
    ];

    let html = '';
    devices.forEach(device => {
      const stateObj = hass.states[device.entity];
      const stateValue = stateObj ? stateObj.state : 'Indisponible';
      const unit = stateObj && stateObj.attributes.unit_of_measurement ? stateObj.attributes.unit_of_measurement : '';
      
      // Détermination simple si l'appareil consomme/fonctionne (> 5W par exemple)
      const power = parseFloat(stateValue) || 0;
      const isActive = power > 5;

      htmlimports:
      html += `
        <div style="background: var(--card-background-color, #1c1c1c); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid var(--divider-color, #333);">
          <div style="font-size: 28px; margin-bottom: 6px;">${isActive ? '🟢' : '⚪'}</div>
          <div style="font-weight: bold; font-size: 14px; color: var(--primary-text-color);">${device.name}</div>
          <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px;">${stateValue} ${unit}</div>
        </div>
      `;
    });

    this.content.innerHTML = html;
  }

  setConfig(config) {
    this.config = config;
  }

  getCardSize() {
    return 3;
  }
}

customElements.define('mes-appareils-card', MesAppareilsCard);
