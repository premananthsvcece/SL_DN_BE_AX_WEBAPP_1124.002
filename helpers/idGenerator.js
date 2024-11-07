import NumberRange from '../models/NumberRange.js';

/**
 * Generates a custom ID based on a given entity short name.
 * The custom ID is generated based on a range defined for the entity (prefix).
 *
 * @param {string} entityShortName - The prefix for the entity (e.g., 'CUST', 'VEH').
 * @returns {string} - The generated custom ID.
 */
export async function generateCustomId(entityShortName) {
  try {
    console.log(`Searching for entity: ${entityShortName}`);

    // Find the number range by prefix (e.g., 'CUST', 'VEH', etc.)
    const numberRange = await NumberRange.findOne({ prefix: entityShortName });

    // Log the result of the query
    console.log('Number range found:', numberRange);

    // If the number range is not found, throw an error
    if (!numberRange) {
      console.error(`Number range for ${entityShortName} not found`);
      throw new Error(`Number range for ${entityShortName} not found`);
    }

    // Convert range_start, range_end, and running_number to numbers for comparison
    const rangeStart = parseInt(numberRange.range_start);
    const rangeEnd = parseInt(numberRange.range_end);
    const runningNumber = parseInt(numberRange.running_number);

    // Check if the range has been exhausted
    if (runningNumber >= rangeEnd) {
      throw new Error(`Number range for ${entityShortName} has been exhausted`);
    }

    // Generate the new ID based on the prefix and the incremented running number
    const newId = `${entityShortName}-${runningNumber + 1}`;

    // Update the running number and save the changes to the database
    numberRange.running_number = (runningNumber + 1).toString();
    await numberRange.save();

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