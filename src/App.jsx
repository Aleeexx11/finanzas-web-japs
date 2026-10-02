import { Button } from '@/components/ui/button'

function App() {
  return (
    <>
      <section className="bg-white dark:bg-gray-900 p-10 m-10"> 
          <h1 className="text-3xl font-bold underline">
            Empezando el Proyecto!!!!
          </h1>
          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>
        <Button type="button" className="counter"></Button>
      </section>
      
      <div className="flex gap-2">
      <Button onClick={() => alert('El boton funciona')}>probar boton</Button>
      <Button variant="outline">Secundaio</Button>
      </div>
    </>
  );
}

export default App
