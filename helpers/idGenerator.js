import knexLib from 'knex';
import knexConfig from '../knexfile.js'; // Import your Knex configuration

const knex = knexLib(knexConfig); // Initialize Knex with the configuration

// Your existing generateCustomId function
export async function generateCustomId(entityShortName) {
  try {
    console.log(`Searching for entity: ${entityShortName}`);

    // Find the number range by prefix (e.g., 'CUST', 'VEH', etc.)
    const numberRange = await knex('number_range')
      .where({ prefix: entityShortName })
      .first();

    // Log the result of the query
    console.log('Number range found:', numberRange);

    // If the number range is not found, throw an error
    if (!numberRange) {
      console.error(`Number range for ${entityShortName} not found`);
      throw new Error(`Number range for ${entityShortName} not found`);
    }

    // Check if the range has been exhausted
    if (numberRange.running_number >= numberRange.range_end) {
      throw new Error(`Number range for ${entityShortName} has been exhausted`);
    }

    // Generate the new ID based on the prefix and the incremented running number
    const newId = `${entityShortName}-${numberRange.running_number + 1}`;

    // Update the running number in the database
    await knex('number_range')
      .where({ prefix: entityShortName })
      .update({ running_number: numberRange.running_number + 1 });

    // Return the generated ID
    return newId;
  } catch (error) {
    console.error('Error generating custom ID:', error);
    throw error;
  }
}

// Wrapper functions for different entities to generate specific IDs
export async function generateCustomerId() {
  return generateCustomId('CUST');
}

export async function generateVehicleId() {
  return generateCustomId('VEH');
}

export async function generateInventoryId() {
  return generateCustomId('INV');
}

export async function generateJobCardId() {
  return generateCustomId('JOB');
}

export async function generateServiceId() {
  return generateCustomId('SER');
}

export async function generateAppointmentId() {
  return generateCustomId('APMT');
}

export async function generatePrNo() {
  return generateCustomId('PR');
}