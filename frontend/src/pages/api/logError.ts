import fsPromises from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'json/runtimeError.json');

export default async function handler(req, res) {
  // Ensure directory exists
  try {
    await fsPromises.mkdir(path.dirname(dataFilePath), { recursive: true });
  } catch (error) {
    // Ignore if directory already exists
  }

  if (req.method === 'GET') {
    try {
      // Check if file exists
      try {
        await fsPromises.access(dataFilePath);
      } catch (error) {
        // File doesn't exist, return empty object
        return res.status(200).json({});
      }

      // Read the existing data from the JSON file
      const jsonData = await fsPromises.readFile(dataFilePath, 'utf-8');

      // Handle empty file
      if (!jsonData || jsonData.trim() === '') {
        // Write empty JSON object to file
        await fsPromises.writeFile(dataFilePath, '{}', 'utf-8');
        return res.status(200).json({});
      }

      // Parse JSON data
      try {
        const objectData = JSON.parse(jsonData);
        return res.status(200).json(objectData);
      } catch (parseError) {
        console.error('Error parsing JSON from file:', parseError);
        // Reset the file with valid JSON if parsing fails
        await fsPromises.writeFile(dataFilePath, '{}', 'utf-8');
        return res.status(200).json({});
      }
    } catch (error) {
      console.error('Error in GET handler:', error);
      return res.status(200).json({}); // Return empty object instead of error
    }
  } else if (req.method === 'POST') {
    try {
      const updatedData = JSON.stringify(req.body);

      // Create directory if it doesn't exist
      await fsPromises.mkdir(path.dirname(dataFilePath), { recursive: true });

      // Write the updated data to the JSON file
      await fsPromises.writeFile(dataFilePath, updatedData);

      // Send a success response
      res.status(200).json({ message: 'Data stored successfully' });
    } catch (error) {
      console.error('Error in POST handler:', error);
      // Send an error response
      res.status(500).json({ message: 'Error storing data' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Create directory if it doesn't exist
      await fsPromises.mkdir(path.dirname(dataFilePath), { recursive: true });

      // Write empty JSON object to file
      await fsPromises.writeFile(dataFilePath, '{}');

      // Send a success response
      res.status(200).json({message: 'Data deleted successfully'});
    } catch (error) {
      console.error('Error in DELETE handler:', error);
      // Send an error response
      res.status(500).json({message: 'Error deleting data'});
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
