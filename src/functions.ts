import { Data, Input, Output } from "./types/dataTypes";
import vgsalesData from './vgsales.json';

// types
interface VgsalesData {
    Rank: number;
    Name: string;
    Platform: string;
    Year: string;
    Publisher: string;
    NA_Sales: number;
    EU_Sales: number;
    JP_Sales: number;
    Other_Sales: number;
    Global_Sales: number;
}

enum Genre {
    Action = "Action",
    Adventure = "Adventure",
    Fighting = "Fighting",
    Misc = "Misc",
    Platform = "Platform",
    Puzzle = "Puzzle",
    Racing = "Racing",
    RolePlaying = "Role-Playing",
    Shooter = "Shooter",
    Simulation = "Simulation",
    Sports = "Sports",
    Strategy = "Strategy",
}
type OutputType = {
    [key: string]: number;
};

interface BagOfWords {
    [key: string]: number;
  }


  // declaration of brain
declare const brain: any;

// Function to create the bag of words
function createBagOfWords(data: VgsalesData[]): BagOfWords {
    const bagOfWords: BagOfWords = {};
    let index = 0;
    data.forEach(game => {
      game.Name.split(/\s+/).forEach(word => {
        if (!(word in bagOfWords)) {
          bagOfWords[word] = index++;
        }
      });
    });
    return bagOfWords;
  }
  
  // Function to create training data
  function createTrainingData(data: VgsalesData[], bagOfWords: BagOfWords): { input: number[]; output: number[] }[] {
    const sales = [...new Set(data.map(item => {
      return { 
      NA: item.NA_Sales, 
      EU: item.EU_Sales,
      JP: item.JP_Sales,
      Global: item.Global_Sales
      }
      }))];
    const salesIndices: BagOfWords = {};
    sales.forEach((pub, i) => salesIndices[pub.NA,pub.EU,pub.JP,pub.Global] = i);
  
    return data.map(item => {
      const input = new Array(Object.keys(bagOfWords).length).fill(0);
      item.Name.split(/\s+/).forEach(word => {
        const wordIndex = bagOfWords[word];
        if (wordIndex !== undefined) {
          input[wordIndex] = 1;
        }
      });
  
      const output = new Array(sales.length).fill(0);
      const salesIndex = salesIndices[item.NA_Sales,item.EU_Sales,item.JP_Sales,item.Global_Sales];
      if (salesIndex !== undefined) {
        output[salesIndex] = 1;
      }
  
      return { input, output };
    });
  }
  
  // Function to predict the publisher of a game
  function predictSales(
    gameName: string,
    processInput: (input: number[]) => number[], // This function is your neural network's prediction function.
    bagOfWords: BagOfWords,
    salesList: number[]
  ) {
    const input = new Array(Object.keys(bagOfWords).length).fill(0);
    gameName.split(/\s+/).forEach(word => {
      const wordIndex = bagOfWords[word];
      if (wordIndex !== undefined) {
        input[wordIndex] = 1;
      }
    });
  
    // Use the provided processInput function to get the output
    const output = processInput(input);
    const highestProbabilityIndex = output.findIndex(value => value === Math.max(...output));
    const predictedSales = salesList[highestProbabilityIndex];
  
    return predictedSales;
  }
  
  // Assuming a trainModel function exists that trains your model and returns a prediction function
  function trainModel(trainingData: any) {
    // Create a new instance of a Neural Network
    const net = new brain.NeuralNetwork({
      hiddenLayers: [16], // This is a simple network with one hidden layer of 3 neurons
      iterations: 500000, // The maximum times to iterate the training data
      learningRate: 0.1, // Global learning rate, useful when training using streams
      inputSize: 1,
      outputSize: 4,
    });
  
    // Train the network with the prepared training data
    net.train(trainingData.map((item: any) => ({
      input: item.input,
      output: item.output
    })));

    (document.querySelector('#app') as HTMLDivElement).innerHTML = brain.utilities.toSVG(net);
  
    // The trained model is now ready to make predictions
    // We return a function that takes an input array and returns the processed output array
    return (input: any) => net.run(input);
  }
  
  // Main functionality to create the bag of words, train the model, and predict the publisher
  export function predictSalesAmount(gameName: string): void {
    const bagOfWords = createBagOfWords(vgsalesData);
    const trainingData = createTrainingData(vgsalesData, bagOfWords);
    const processInput = trainModel(trainingData);
    const salesList = [...new Set(vgsalesData.map(item =>  {
      return { 
      NA: item.NA_Sales, 
      EU: item.EU_Sales,
      JP: item.JP_Sales,
      Global: item.Global_Sales
      }
      }))];
      // console.dir(salesList);
  
    const predictedSales = predictSales(gameName, processInput, bagOfWords,salesList as any);
    // console.dir(predictedSales);
    console.log(`The predicted sales for "${gameName}" is ${JSON.stringify(predictedSales)} Million`);
  }
