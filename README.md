# Mes Appareils — Carte Lovelace Personnalisée

Carte Lovelace animée en SVG pour suivre la consommation, la température et l'état de tes appareils électroménagers, multimédia et domotiques dans Home Assistant.

![Aperçu](https://raw.githubusercontent.com/USERNAME/mes-appareils-card/main/preview.png)

## 🛠️ Installation via HACS

1. Ouvre **HACS** > **Interface** > 3 points en haut à droite > **Dépôts personnalisés**.
2. Ajoute l'URL : `https://github.com/USERNAME/mes-appareils-card` avec le type **Plugin**.
3. Clique sur **Télécharger**.
4. Recharge ton navigateur.

## 📝 Configuration Dashboard

```yaml
type: custom:mes-appareils-card
appliance: washer
name: Lave-linge Buanderie
entity: sensor.prise_lave_linge_power
power: sensor.prise_lave_linge_power
energy: sensor.prise_lave_linge_energy
threshold: 10
