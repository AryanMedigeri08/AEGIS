// Mock TFLite model loader for Web platform
export async function loadTensorflowModel(source, delegates) {
  console.log('TFLite Model loaded in web simulation mode:', source);
  return {
    inputs: [],
    outputs: [],
    runSync: (input) => [],
    run: async (input) => [],
  };
}
