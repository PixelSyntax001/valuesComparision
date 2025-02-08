import React, { useState, useCallback, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, ComposedChart, ResponsiveContainer } from 'recharts';

const defaultParams = {
  baseStrength: 1000,
  brutal: 0.1,
  guildBuff: 0.05,
  guildConquestBuff: 0.05,
  blessingBuffs: 0.1,
  celestialBonds: 0.05,
  guardianStone: 0.05,
  maskBuff: 0.05,
  otherStrTraits: 0.05,
  aggressive: 0.2,
  strResist: 0.1,
  block: 100,
  skillMultiplier: 1.5,
  fortitude: 50,
  pierce: 0.2,
  tenacity: 0.1,
  dmgIncrease: 0.3,
  dmgReduction: 0.2,
  criticalRate: 0.5,
  enemyCriticalEvadeRate: 0.1,
  criticalDamageMultiplier: 1.5,
  enemyCriticalDamageReduction: 0.2,
};

const styles = {
  container: {
    maxWidth: '100%',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    minWidth: '100%',
  },
  calculatorsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  calculator: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#333',
  },
  inputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.875rem',
    marginBottom: '4px',
    color: '#666',
  },
  input: {
    padding: '6px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.875rem',
    width: '100%',
  },
  graphContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  tooltip: {
    backgroundColor: 'white',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  tooltipText: {
    margin: '4px 0',
    fontSize: '0.875rem',
  },
};

function DamageCalculator() {
  // Initialize state from URL query parameters or default values
  const initializeFromQuery = () => {
    const params = new URLSearchParams(window.location.search);
    const build1 = { ...defaultParams };
    const build2 = { ...defaultParams };

    // Parse query parameters for both builds
    params.forEach((value, key) => {
      const [build, param] = key.split('_');
      if (build === 'b1' && param in defaultParams) {
        build1[param] = parseFloat(value);
      } else if (build === 'b2' && param in defaultParams) {
        build2[param] = parseFloat(value);
      }
    });

    return { build1, build2 };
  };

  const initialState = initializeFromQuery();
  const [params1, setParams1] = useState(initialState.build1);
  const [params2, setParams2] = useState(initialState.build2);

  // Update URL when parameters change
  useEffect(() => {
    const queryParams = new URLSearchParams();
    
    // Add parameters for build 1
    Object.entries(params1).forEach(([key, value]) => {
      queryParams.set(`b1_${key}`, value.toString());
    });
    
    // Add parameters for build 2
    Object.entries(params2).forEach(([key, value]) => {
      queryParams.set(`b2_${key}`, value.toString());
    });

    // Update URL without reloading the page
    const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }, [params1, params2]);

  const calculateDamage = useCallback((strength, params, forceCrit = false) => {
    const percentIncreaseSum = 
      params.brutal + 
      params.guildBuff + 
      params.guildConquestBuff + 
      params.blessingBuffs + 
      params.celestialBonds + 
      params.guardianStone + 
      params.maskBuff + 
      params.otherStrTraits;

    const modifiedStrength = strength * (1 + percentIncreaseSum);
    const afterAggressive = modifiedStrength * (1 + params.aggressive);
    const afterResist = afterAggressive * (1 - params.strResist);
    const afterBlock = afterResist - params.block;
    const afterSkillAndFort = (afterBlock * params.skillMultiplier) - params.fortitude;
    const afterPierce = afterSkillAndFort * (1 + (params.pierce - params.tenacity));
    const afterDmgMods = afterPierce * (1 + params.dmgIncrease) * (1 - params.dmgReduction);
    
    if (forceCrit) {
      return afterDmgMods * (1 + params.criticalDamageMultiplier - params.enemyCriticalDamageReduction);
    }
    return afterDmgMods;
  }, []);

  const handleInputChange = (set) => (e) => {
    const { name, value } = e.target;
    set((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const data = Array.from({ length: 11 }, (_, i) => {
    // Calculate separate strength values for each build
    const strength1 = params1.baseStrength * (0.5 + i * 0.1);
    const strength2 = params2.baseStrength * (0.5 + i * 0.1);
    
    const damage1Normal = calculateDamage(strength1, params1, false);
    const damage1Crit = calculateDamage(strength1, params1, true);
    const damage2Normal = calculateDamage(strength2, params2, false);
    const damage2Crit = calculateDamage(strength2, params2, true);
    
    const percentDiff = (
      ((damage2Normal - damage1Normal) / damage1Normal) *
      100
    ).toFixed(2);
    
    return {
      strength1,
      strength2,
      damage1Normal,
      damage1Crit,
      damage2Normal,
      damage2Crit,
      percentDiff: parseFloat(percentDiff),
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={styles.tooltip}>
          <p style={{ ...styles.tooltipText, fontWeight: 'bold' }}>
            Build 1 Strength: {Math.round(payload[0].payload.strength1)}
          </p>
          {payload[0].payload.strength1 !== payload[0].payload.strength2 && (
            <p style={{ ...styles.tooltipText, fontWeight: 'bold' }}>
              Build 2 Strength: {Math.round(payload[0].payload.strength2)}
            </p>
          )}
          <p style={{ ...styles.tooltipText, color: '#8884d8' }}>
            Build 1 Normal: {payload[0].value.toFixed(0)}
          </p>
          <p style={{ ...styles.tooltipText, color: '#a280d8' }}>
            Build 1 Critical: {payload[1].value.toFixed(0)}
          </p>
          <p style={{ ...styles.tooltipText, color: '#82ca9d' }}>
            Build 2 Normal: {payload[2].value.toFixed(0)}
          </p>
          <p style={{ ...styles.tooltipText, color: '#50a86d' }}>
            Build 2 Critical: {payload[3].value.toFixed(0)}
          </p>
          <p style={{ ...styles.tooltipText, color: '#ff7300' }}>
            Normal Damage Difference: {payload[4].value.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const ParamInput = ({ label, name, value, onChange }) => (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{label}</label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        step="0.01"
        style={styles.input}
      />
    </div>
  );

  const Calculator = ({ params, setParams, title }) => (
    <div style={styles.calculator}>
      <h2 style={styles.title}>{title}</h2>
      <div style={styles.inputGrid}>
        <ParamInput
          label="Base Strength"
          name="baseStrength"
          value={params.baseStrength}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Brutal"
          name="brutal"
          value={params.brutal}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Guild Buff"
          name="guildBuff"
          value={params.guildBuff}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Guild Conquest"
          name="guildConquestBuff"
          value={params.guildConquestBuff}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Blessing Buffs"
          name="blessingBuffs"
          value={params.blessingBuffs}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Celestial Bonds"
          name="celestialBonds"
          value={params.celestialBonds}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Guardian Stone"
          name="guardianStone"
          value={params.guardianStone}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Mask Buff"
          name="maskBuff"
          value={params.maskBuff}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Other Str Traits"
          name="otherStrTraits"
          value={params.otherStrTraits}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Aggressive"
          name="aggressive"
          value={params.aggressive}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Str Resist"
          name="strResist"
          value={params.strResist}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Block"
          name="block"
          value={params.block}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Skill Multiplier"
          name="skillMultiplier"
          value={params.skillMultiplier}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Fortitude"
          name="fortitude"
          value={params.fortitude}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Pierce"
          name="pierce"
          value={params.pierce}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Tenacity"
          name="tenacity"
          value={params.tenacity}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Damage Increase"
          name="dmgIncrease"
          value={params.dmgIncrease}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Damage Reduction"
          name="dmgReduction"
          value={params.dmgReduction}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Critical Rate"
          name="criticalRate"
          value={params.criticalRate}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Enemy Crit Evade"
          name="enemyCriticalEvadeRate"
          value={params.enemyCriticalEvadeRate}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Crit Damage Multi"
          name="criticalDamageMultiplier"
          value={params.criticalDamageMultiplier}
          onChange={handleInputChange(setParams)}
        />
        <ParamInput
          label="Enemy Crit Dmg Red"
          name="enemyCriticalDamageReduction"
          value={params.enemyCriticalDamageReduction}
          onChange={handleInputChange(setParams)}
        />
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.calculatorsContainer}>
        <Calculator params={params1} setParams={setParams1} title="Build 1" />
        <Calculator params={params2} setParams={setParams2} title="Build 2" />
      </div>

      <div style={styles.graphContainer}>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="strength1" 
              label={{ value: 'Strength', position: 'bottom' }} 
              interval="preserveStartEnd" 
              tickFormatter={(value) => Math.round(value)}
            />
            <YAxis yAxisId="damage" label={{ value: 'Final Damage', angle: -90, position: 'insideLeft' }} interval="preserveStartEnd" />
            <YAxis yAxisId="percent" orientation="right" label={{ value: 'Difference %', angle: 90, position: 'insideRight' }} interval="preserveStartEnd" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line yAxisId="damage" type="monotone" dataKey="damage1Normal" stroke="#8884d8" name="Build 1 Normal" />
            <Line yAxisId="damage" type="monotone" dataKey="damage1Crit" stroke="#a280d8" name="Build 1 Critical" strokeDasharray="5 5" />
            <Line yAxisId="damage" type="monotone" dataKey="damage2Normal" stroke="#82ca9d" name="Build 2 Normal" />
            <Line yAxisId="damage" type="monotone" dataKey="damage2Crit" stroke="#50a86d" name="Build 2 Critical" strokeDasharray="5 5" />
            <Area yAxisId="percent" type="monotone" dataKey="percentDiff" fill="#ff7300" stroke="#ff7300" name="% Difference (Normal)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DamageCalculator;
